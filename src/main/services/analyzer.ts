import type {
  AllocationSlice,
  Analysis,
  Holding,
  NewsScore,
  RebalanceSuggestion,
  Sector,
  Settings,
  StockSuggestion
} from '../../shared/types'
import { UNIVERSE } from './stockUniverse'

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function allocationByKey(
  holdings: Holding[],
  keyFn: (h: Holding) => { key: string; label: string }
): AllocationSlice[] {
  const total = holdings.reduce((s, h) => s + h.investedInr, 0)
  const map = new Map<string, AllocationSlice>()
  for (const h of holdings) {
    const { key, label } = keyFn(h)
    const slice = map.get(key) ?? { key, label, investedInr: 0, pct: 0 }
    slice.investedInr += h.investedInr
    map.set(key, slice)
  }
  const slices = [...map.values()].map((s) => ({
    ...s,
    pct: total > 0 ? (s.investedInr / total) * 100 : 0
  }))
  return slices.sort((a, b) => b.investedInr - a.investedInr)
}

/**
 * A simple, transparent diversification score: it rewards spreading capital
 * across more sectors and penalizes concentration (via a normalized
 * Herfindahl-Hirschman index over sector weights). 0 = everything in one
 * sector, 100 = perfectly even across many sectors.
 */
function diversificationScore(bySector: AllocationSlice[]): number {
  if (bySector.length === 0) return 0
  const hhi = bySector.reduce((s, x) => s + Math.pow(x.pct / 100, 2), 0)
  const n = bySector.length
  // Even split across n sectors gives hhi = 1/n; single sector gives hhi = 1.
  const evenness = (1 - hhi) / (1 - 1 / Math.max(n, 1) || 1)
  const breadth = Math.min(n / 8, 1) // 8+ sectors counts as full breadth
  return Math.round(Math.max(0, Math.min(1, 0.6 * evenness + 0.4 * breadth)) * 100)
}

function buildRebalance(
  holdings: Holding[],
  byStock: AllocationSlice[],
  bySector: AllocationSlice[],
  settings: Settings
): RebalanceSuggestion[] {
  const out: RebalanceSuggestion[] = []
  if (holdings.length === 0) return out

  // 1) Single-stock concentration.
  for (const s of byStock) {
    if (s.pct > settings.stockConcentrationPct) {
      out.push({
        id: `stock-conc-${s.key}`,
        severity: s.pct > settings.stockConcentrationPct + 15 ? 'high' : 'medium',
        title: `${s.label} is ${s.pct.toFixed(0)}% of your portfolio`,
        detail: `A single stock above ~${settings.stockConcentrationPct}% concentrates a lot of single-company risk. Consider trimming ${s.label} (${inr(
          s.investedInr
        )}) toward roughly ${settings.stockConcentrationPct}% and redeploying the difference into under-represented sectors.`
      })
    }
  }

  // 2) Single-sector concentration.
  for (const s of bySector) {
    if (s.pct > settings.sectorConcentrationPct) {
      out.push({
        id: `sector-conc-${s.key}`,
        severity: s.pct > settings.sectorConcentrationPct + 15 ? 'high' : 'medium',
        title: `${s.label} sector is ${s.pct.toFixed(0)}% of your portfolio`,
        detail: `Heavy tilt toward ${s.label}. If this sector hits a rough patch, the whole portfolio feels it. Consider capping ${s.label} near ${settings.sectorConcentrationPct}% and adding exposure elsewhere.`
      })
    }
  }

  // 3) Too few names.
  if (holdings.length < 5) {
    out.push({
      id: 'too-few',
      severity: 'medium',
      title: `Only ${holdings.length} holding${holdings.length === 1 ? '' : 's'}`,
      detail:
        'Very few positions means each one swings your returns a lot. Spreading across ~8–15 quality names across sectors typically smooths the ride.'
    })
  }

  // 4) Sector breadth.
  const sectorCount = bySector.length
  if (sectorCount > 0 && sectorCount < 4 && holdings.length >= 3) {
    out.push({
      id: 'few-sectors',
      severity: 'low',
      title: `Exposure to only ${sectorCount} sector${sectorCount === 1 ? '' : 's'}`,
      detail:
        'Adding a couple of uncorrelated sectors (e.g. FMCG, Pharma, or IT) can reduce how much any one economic theme drives your outcome.'
    })
  }

  // 5) All-clear note.
  if (out.length === 0) {
    out.push({
      id: 'looks-balanced',
      severity: 'info',
      title: 'No major concentration flags',
      detail:
        'Your spread across stocks and sectors looks reasonable against the configured thresholds. Keep reviewing as positions drift.'
    })
  }

  return out
}

function buildStockSuggestions(
  holdings: Holding[],
  bySector: AllocationSlice[],
  news: NewsScore[],
  settings: Settings
): StockSuggestion[] {
  const held = new Set(holdings.map((h) => h.symbol))
  const heldSectors = new Set(holdings.map((h) => h.sector))

  // Identify under-represented sectors (target an even-ish spread).
  const sectorPct = new Map<string, number>(bySector.map((s) => [s.key, s.pct]))
  const allSectors = [...new Set(UNIVERSE.map((u) => u.sector))]
  const targetPct = 100 / Math.min(8, Math.max(4, allSectors.length))

  const newsBySymbol = new Map(news.map((n) => [n.symbol, n]))
  const maxTrust = Math.max(1, ...news.map((n) => n.trustScore))

  const candidates = UNIVERSE.filter((u) => !held.has(u.symbol))

  const scored: StockSuggestion[] = candidates.map((c) => {
    const reasons: string[] = []
    let score = 0

    // (a) Diversification fit: reward sectors the user is light on.
    const current = sectorPct.get(c.sector) ?? 0
    if (holdings.length > 0 && current < targetPct) {
      const gap = (targetPct - current) / targetPct // 0..1
      score += gap * 45
      if (!heldSectors.has(c.sector)) {
        reasons.push(`Adds a new sector (${c.sector}) you don't hold yet`)
      } else {
        reasons.push(`Tops up ${c.sector}, which is under-weight in your mix`)
      }
    } else if (holdings.length === 0) {
      score += 20
      reasons.push('A widely-held large-cap to start a diversified base')
    }

    // (b) Verified news momentum from whitelisted sources.
    const n = newsBySymbol.get(c.symbol)
    if (n) {
      const momentum = (n.trustScore / maxTrust) * 45
      score += momentum
      reasons.push(
        `In the news across ${n.distinctSources} verified source${
          n.distinctSources === 1 ? '' : 's'
        } (${n.mentions} recent ${n.mentions === 1 ? 'headline' : 'headlines'})`
      )
    }

    // (c) Mild bias toward recognizable large caps for stability.
    score += 5

    return {
      symbol: c.symbol,
      name: c.name,
      sector: c.sector,
      score: Math.round(Math.min(100, score)),
      reasons,
      evidence: n?.headlines ?? []
    }
  })

  return scored
    .filter((s) => s.reasons.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, settings.maxSuggestions)
}

export function analyze(
  holdings: Holding[],
  news: NewsScore[],
  settings: Settings
): Analysis {
  const byStock = allocationByKey(holdings, (h) => ({ key: h.symbol, label: h.name }))
  const bySector = allocationByKey(holdings, (h) => ({
    key: h.sector,
    label: h.sector as Sector
  }))
  const totalInvestedInr = holdings.reduce((s, h) => s + h.investedInr, 0)

  return {
    totalInvestedInr,
    byStock,
    bySector,
    rebalance: buildRebalance(holdings, byStock, bySector, settings),
    suggestions: buildStockSuggestions(holdings, bySector, news, settings),
    diversificationScore: diversificationScore(bySector)
  }
}

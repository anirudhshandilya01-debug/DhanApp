import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { AppData, Holding, Settings } from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../shared/types'
import { lookupSymbol } from './stockUniverse'

// Personal portfolio data lives in the OS-standard per-user app directory
// (e.g. %APPDATA%/dhan-advisor on Windows). It never touches the repo.
function dataFile(): string {
  return join(app.getPath('userData'), 'portfolio.json')
}

const emptyData: AppData = { holdings: [], settings: { ...DEFAULT_SETTINGS } }

let cache: AppData | null = null

export async function load(): Promise<AppData> {
  if (cache) return cache
  try {
    const raw = await fs.readFile(dataFile(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppData>
    cache = {
      holdings: Array.isArray(parsed.holdings) ? parsed.holdings : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) }
    }
  } catch {
    cache = { ...emptyData, settings: { ...DEFAULT_SETTINGS } }
  }
  return cache
}

async function persist(): Promise<void> {
  if (!cache) return
  await fs.writeFile(dataFile(), JSON.stringify(cache, null, 2), 'utf-8')
}

export async function getHoldings(): Promise<Holding[]> {
  return (await load()).holdings
}

export async function getSettings(): Promise<Settings> {
  return (await load()).settings
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const data = await load()
  data.settings = { ...data.settings, ...patch }
  await persist()
  return data.settings
}

export interface HoldingInput {
  symbol: string
  investedInr: number
  /** Optional override for off-universe tickers. */
  name?: string
  dateOfInvestment?: string // ISO date string, e.g. "2024-01-15"
  avgBuyPrice?: number // auto-fetched by IPC layer; stored as-is
}

export async function addHolding(input: HoldingInput): Promise<Holding[]> {
  const data = await load()
  const known = lookupSymbol(input.symbol)
  const symbol = input.symbol.trim().toUpperCase()
  const existing = data.holdings.find((h) => h.symbol === symbol)
  if (existing) {
    // Adding the same symbol again tops up the existing position.
    existing.investedInr += Math.max(0, input.investedInr)
    if (!existing.dateOfInvestment && input.dateOfInvestment) {
      existing.dateOfInvestment = input.dateOfInvestment
      if (input.avgBuyPrice) existing.avgBuyPrice = input.avgBuyPrice
    }
  } else {
    data.holdings.push({
      id: randomUUID(),
      symbol,
      name: known?.name ?? input.name ?? symbol,
      sector: known?.sector ?? 'Other',
      investedInr: Math.max(0, input.investedInr),
      dateOfInvestment: input.dateOfInvestment,
      avgBuyPrice: input.avgBuyPrice
    })
  }
  await persist()
  return data.holdings
}

export async function updateHolding(
  id: string,
  patch: Partial<Pick<Holding, 'investedInr' | 'name' | 'sector' | 'dateOfInvestment' | 'avgBuyPrice'>>
): Promise<Holding[]> {
  const data = await load()
  const h = data.holdings.find((x) => x.id === id)
  if (h) {
    if (typeof patch.investedInr === 'number') h.investedInr = Math.max(0, patch.investedInr)
    if (patch.name) h.name = patch.name
    if (patch.sector) h.sector = patch.sector
    if (patch.dateOfInvestment !== undefined) h.dateOfInvestment = patch.dateOfInvestment
    if (typeof patch.avgBuyPrice === 'number') h.avgBuyPrice = patch.avgBuyPrice
    await persist()
  }
  return data.holdings
}

export async function removeHolding(id: string): Promise<Holding[]> {
  const data = await load()
  data.holdings = data.holdings.filter((h) => h.id !== id)
  await persist()
  return data.holdings
}

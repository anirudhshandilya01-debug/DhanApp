import Parser from 'rss-parser'
import type { NewsScore, NewsState, VerifiedHeadline } from '../../shared/types'
import { TRUSTED_SOURCES, isVerifiedLink, publicSources } from './sources'
import { UNIVERSE } from './stockUniverse'

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'DhanAdvisor/1.0 (personal portfolio research tool)' }
})

type Listener = (state: NewsState) => void

/**
 * Pulls market news from the whitelisted feeds on a timer, verifies every item,
 * matches verified headlines to the known stock universe, and produces a
 * trust-weighted "mention" score per stock. This is the "continuous web search
 * with a verification layer" described in the README.
 */
export class NewsEngine {
  private state: NewsState = {
    lastUpdated: null,
    isFetching: false,
    verifiedCount: 0,
    rejectedCount: 0,
    scores: [],
    recent: [],
    sources: publicSources(),
    lastError: null
  }

  private listeners = new Set<Listener>()
  private timer: NodeJS.Timeout | null = null
  private freshnessHours = 72

  getState(): NewsState {
    return this.state
  }

  onUpdate(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(): void {
    for (const l of this.listeners) l(this.state)
  }

  start(refreshMinutes: number, freshnessHours: number): void {
    this.freshnessHours = freshnessHours
    if (this.timer) clearInterval(this.timer)
    // Kick off an immediate fetch, then repeat on the configured cadence.
    void this.refresh()
    this.timer = setInterval(
      () => void this.refresh(),
      Math.max(1, refreshMinutes) * 60_000
    )
  }

  reconfigure(refreshMinutes: number, freshnessHours: number): void {
    this.start(refreshMinutes, freshnessHours)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  async refresh(): Promise<NewsState> {
    if (this.state.isFetching) return this.state
    this.state = { ...this.state, isFetching: true, lastError: null }
    this.emit()

    const verified: VerifiedHeadline[] = []
    let rejected = 0
    const errors: string[] = []
    const cutoff = Date.now() - this.freshnessHours * 3600_000

    for (const source of TRUSTED_SOURCES) {
      for (const feedUrl of source.feeds) {
        try {
          const feed = await parser.parseURL(feedUrl)
          for (const item of feed.items ?? []) {
            const link = item.link
            // VERIFICATION GATE: domain allowlist + HTTPS + freshness window.
            if (!isVerifiedLink(link)) {
              rejected++
              continue
            }
            const published = item.isoDate ? Date.parse(item.isoDate) : Date.now()
            if (Number.isFinite(published) && published < cutoff) {
              rejected++
              continue
            }
            verified.push({
              title: (item.title ?? '').trim(),
              link: link as string,
              sourceId: source.id,
              sourceName: source.name,
              domain: source.domain,
              trustWeight: source.trustWeight,
              publishedAt: new Date(published).toISOString()
            })
          }
        } catch (err) {
          errors.push(`${source.name}: ${(err as Error).message}`)
        }
      }
    }

    // De-duplicate by normalized title (publishers syndicate the same story).
    const seen = new Set<string>()
    const deduped = verified.filter((h) => {
      const key = h.title.toLowerCase().replace(/\s+/g, ' ').trim()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })

    const scores = this.scoreStocks(deduped)

    this.state = {
      lastUpdated: new Date().toISOString(),
      isFetching: false,
      verifiedCount: deduped.length,
      rejectedCount: rejected,
      scores,
      recent: deduped
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .slice(0, 40),
      sources: publicSources(),
      // Only surface an error if every feed failed (e.g. offline). Partial
      // failures are normal and shouldn't alarm the user.
      lastError:
        deduped.length === 0 && errors.length > 0
          ? `Could not reach sources right now. ${errors[0]}`
          : null
    }
    this.emit()
    return this.state
  }

  private scoreStocks(headlines: VerifiedHeadline[]): NewsScore[] {
    const map = new Map<string, NewsScore>()

    for (const stock of UNIVERSE) {
      const needles = [stock.name.toLowerCase(), ...stock.aliases]
      const matched = headlines.filter((h) => {
        const t = ` ${h.title.toLowerCase()} `
        return needles.some((n) => t.includes(n))
      })
      if (matched.length === 0) continue

      const distinct = new Set(matched.map((m) => m.sourceId))
      const trustScore = [...distinct].reduce((sum, id) => {
        const src = TRUSTED_SOURCES.find((s) => s.id === id)
        return sum + (src?.trustWeight ?? 0)
      }, 0)

      map.set(stock.symbol, {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        mentions: matched.length,
        trustScore,
        distinctSources: distinct.size,
        headlines: matched
          .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
          .slice(0, 5)
      })
    }

    return [...map.values()].sort(
      (a, b) => b.trustScore - a.trustScore || b.mentions - a.mentions
    )
  }
}

export const newsEngine = new NewsEngine()

import type { StockPricesState } from '../../shared/types'

const YF_HEADERS = { 'User-Agent': 'DhanAdvisor/1.0 (personal portfolio research tool)' }

interface YfChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number
        previousClose?: number
        regularMarketDayHigh?: number
        regularMarketDayLow?: number
        fiftyTwoWeekHigh?: number
        fiftyTwoWeekLow?: number
        marketCap?: number
        symbol?: string
      }
      timestamp?: number[]
      indicators?: {
        quote?: Array<{ close?: (number | null)[] }>
      }
    }>
  }
}

let _state: StockPricesState = {
  prices: {},
  lastUpdated: null,
  isFetching: false,
  error: null
}

export function getPricesState(): StockPricesState {
  return { ..._state, prices: { ..._state.prices } }
}

export async function fetchCurrentPrices(symbols: string[]): Promise<StockPricesState> {
  if (symbols.length === 0) {
    _state = { prices: {}, lastUpdated: null, isFetching: false, error: null }
    return getPricesState()
  }

  _state = { ..._state, isFetching: true, error: null }

  try {
    // v8 chart endpoint works without a crumb; fetch all symbols in parallel.
    const settled = await Promise.allSettled(
      symbols.map(async (sym) => {
        const ticker = `${sym.toUpperCase()}.NS`
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
        const res = await fetch(url, { headers: YF_HEADERS })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as YfChartResponse
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
        return { sym, price }
      })
    )

    const prices: Record<string, number> = {}
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value.price != null) {
        prices[r.value.sym] = r.value.price
      }
    }

    _state = {
      prices,
      lastUpdated: new Date().toISOString(),
      isFetching: false,
      error: null
    }
  } catch (err) {
    _state = {
      ..._state,
      isFetching: false,
      error: err instanceof Error ? err.message : 'Failed to fetch prices'
    }
  }

  return getPricesState()
}

// Fetches the closing price on a given date (ISO string like "2024-01-15").
// Searches a ±4 day window to handle weekends and public holidays.
export async function fetchHistoricalClose(
  symbol: string,
  date: string
): Promise<number | undefined> {
  const ticker = `${symbol.toUpperCase()}.NS`
  const targetMs = new Date(date).getTime()
  const period1 = Math.floor(targetMs / 1000) - 86400 * 4
  const period2 = Math.floor(targetMs / 1000) + 86400 * 4

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&period1=${period1}&period2=${period2}`
    const res = await fetch(url, { headers: YF_HEADERS })
    if (!res.ok) return undefined

    const data = (await res.json()) as YfChartResponse
    const result = data?.chart?.result?.[0]
    if (!result) return undefined

    const timestamps = result.timestamp ?? []
    const closes = result.indicators?.quote?.[0]?.close ?? []

    // Pick the trading day whose timestamp is closest to the target date
    let bestIdx = -1
    let bestDiff = Infinity
    for (let i = 0; i < timestamps.length; i++) {
      const diff = Math.abs(timestamps[i] * 1000 - targetMs)
      if (diff < bestDiff && closes[i] != null) {
        bestDiff = diff
        bestIdx = i
      }
    }

    return bestIdx >= 0 ? (closes[bestIdx] as number) : undefined
  } catch {
    return undefined
  }
}

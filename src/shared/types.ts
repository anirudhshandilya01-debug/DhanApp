// Types shared across the main process, preload bridge, and renderer.

export type Sector =
  | 'Financials'
  | 'IT'
  | 'Energy'
  | 'FMCG'
  | 'Auto'
  | 'Pharma'
  | 'Metals'
  | 'Infrastructure'
  | 'Telecom'
  | 'Consumer'
  | 'Chemicals'
  | 'Realty'
  | 'Power'
  | 'Cement'
  | 'Electronics'
  | 'Aviation'
  | 'Media'
  | 'Defence'
  | 'Textiles'
  | 'Other'

export interface UniverseStock {
  symbol: string // NSE symbol, e.g. "TCS"
  name: string // Company name, e.g. "Tata Consultancy Services"
  sector: Sector
  /** Lowercased aliases used to match the company in news headlines. */
  aliases: string[]
}

export interface Holding {
  id: string
  symbol: string
  name: string
  sector: Sector
  investedInr: number // amount invested, in INR
  dateOfInvestment?: string // ISO date string, e.g. "2024-01-15"
  avgBuyPrice?: number // average buy price per share in INR (auto-fetched via Yahoo Finance)
}

export interface StockPricesState {
  prices: Record<string, number> // symbol -> latest market price in INR
  lastUpdated: string | null // ISO UTC string of when prices were last fetched
  isFetching: boolean
  error: string | null
}

export interface SourceInfo {
  id: string
  name: string
  /** Publisher home domain, shown to the user for transparency. */
  domain: string
  /** Editorial trust weight in [0,1]; higher = more authoritative. */
  trustWeight: number
}

export interface VerifiedHeadline {
  title: string
  link: string
  sourceId: string
  sourceName: string
  domain: string
  trustWeight: number
  publishedAt: string // ISO string
}

export interface NewsScore {
  symbol: string
  name: string
  sector: Sector
  /** Number of verified mentions across the freshness window. */
  mentions: number
  /** Sum of trust weights across distinct verified sources. */
  trustScore: number
  /** Count of distinct whitelisted sources mentioning the stock. */
  distinctSources: number
  headlines: VerifiedHeadline[]
}

export interface AllocationSlice {
  key: string // symbol or sector
  label: string
  investedInr: number
  pct: number // 0..100
}

export type SuggestionSeverity = 'high' | 'medium' | 'low' | 'info'

export interface RebalanceSuggestion {
  id: string
  severity: SuggestionSeverity
  title: string
  detail: string
}

export interface StockSuggestion {
  symbol: string
  name: string
  sector: Sector
  /** Composite score 0..100 used only for ordering. */
  score: number
  /** Plain-language reasons this surfaced. */
  reasons: string[]
  /** Verified headlines (whitelisted sources only) backing the idea. */
  evidence: VerifiedHeadline[]
}

export interface Analysis {
  totalInvestedInr: number
  byStock: AllocationSlice[]
  bySector: AllocationSlice[]
  rebalance: RebalanceSuggestion[]
  suggestions: StockSuggestion[]
  diversificationScore: number // 0..100, higher = more diversified
}

export interface Settings {
  refreshMinutes: number
  freshnessHours: number
  maxSuggestions: number
  /** Flag a single stock above this % of the portfolio. */
  stockConcentrationPct: number
  /** Flag a single sector above this % of the portfolio. */
  sectorConcentrationPct: number
}

export interface NewsState {
  lastUpdated: string | null
  isFetching: boolean
  verifiedCount: number
  rejectedCount: number
  scores: NewsScore[]
  recent: VerifiedHeadline[]
  sources: SourceInfo[]
  lastError: string | null
}

export interface AppData {
  holdings: Holding[]
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = {
  refreshMinutes: 30,
  freshnessHours: 72,
  maxSuggestions: 8,
  stockConcentrationPct: 25,
  sectorConcentrationPct: 40
}

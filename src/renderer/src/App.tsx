import { useCallback, useEffect, useState } from 'react'
import {
  Gauge,
  Lightbulb,
  Mail,
  Newspaper,
  RefreshCw,
  Scale,
  Search,
  Settings as SettingsIcon,
  Wallet
} from 'lucide-react'
import type { Analysis, EmailAnalysisState, Holding, NewsState, Settings, StockPricesState } from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../shared/types'
import PortfolioForm from './components/PortfolioForm'
import Holdings from './components/Holdings'
import AllocationChart from './components/AllocationChart'
import Suggestions from './components/Suggestions'
import Rebalance from './components/Rebalance'
import NewsFeed from './components/NewsFeed'
import EmailAnalysis from './components/EmailAnalysis'
import StockSearch from './components/StockSearch'
import SettingsModal from './components/SettingsModal'
import { inr, timeAgo, toISTString } from './util'

const emptyAnalysis: Analysis = {
  totalInvestedInr: 0,
  byStock: [],
  bySector: [],
  rebalance: [],
  suggestions: [],
  diversificationScore: 0
}

export default function App(): JSX.Element {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [analysis, setAnalysis] = useState<Analysis>(emptyAnalysis)
  const [news, setNews] = useState<NewsState | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [prices, setPrices] = useState<StockPricesState>({
    prices: {},
    lastUpdated: null,
    isFetching: false,
    error: null
  })
  const [emailState, setEmailState] = useState<EmailAnalysisState>({
    data: [],
    lastUpdated: null,
    isFetching: false,
    error: null
  })
  const [showSettings, setShowSettings] = useState(false)

  const reload = useCallback(async () => {
    const [h, a, n, p] = await Promise.all([
      window.api.getHoldings(),
      window.api.getAnalysis(),
      window.api.getNews(),
      window.api.getPrices()
    ])
    setHoldings(h)
    setAnalysis(a)
    setNews(n)
    setPrices(p)
  }, [])

  useEffect(() => {
    void reload()
    window.api.getSettings().then(setSettings)
    window.api.getEmailAnalysis().then(setEmailState)
    const off = window.api.onDataUpdated(() => void reload())
    return off
  }, [reload])

  const refreshNow = async (): Promise<void> => {
    const [, p] = await Promise.all([window.api.refreshNews(), window.api.refreshPrices()])
    setPrices(p)
    void reload()
  }

  const refreshEmails = async (): Promise<void> => {
    setEmailState((prev) => ({ ...prev, isFetching: true, error: null }))
    const next = await window.api.refreshEmailAnalysis()
    setEmailState(next)
  }

  const saveSettings = async (patch: Partial<Settings>): Promise<void> => {
    const next = await window.api.saveSettings(patch)
    setSettings(next)
    setShowSettings(false)
    void reload()
  }

  const busy = news?.isFetching ?? false

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark">
            Dhan <em>Advisor</em>
          </span>
          <span className="tag">Private Wealth Terminal</span>
        </div>
        <div className="spacer" />
        <div className={`status-pill ${busy ? 'busy' : ''}`}>
          <span className="dot" />
          {busy
            ? 'Researching markets…'
            : news?.lastUpdated
              ? `${news.verifiedCount} verified · updated ${timeAgo(news.lastUpdated)}`
              : 'Starting research…'}
        </div>
        <button className="ghost-btn" onClick={() => void refreshNow()} disabled={busy}>
          <RefreshCw size={15} className={busy ? 'spin' : ''} /> Refresh
        </button>
        <button className="ghost-btn" onClick={() => setShowSettings(true)}>
          <SettingsIcon size={15} /> Settings
        </button>
      </header>

      <div className="body">
        {/* Left column */}
        <div className="col">
          <section className="card delay-1">
            <div className="card-head">
              <span className="icon">
                <Wallet size={18} />
              </span>
              <h2>Your Portfolio</h2>
              <span className="count">{holdings.length} holdings</span>
            </div>

            <div className="summary-row" style={{ marginBottom: 18 }}>
              <div className="metric">
                <div className="label">Total invested</div>
                <div className="value gold">{inr(analysis.totalInvestedInr)}</div>
              </div>
              <div className="metric">
                <div className="label">Sectors</div>
                <div className="value">{analysis.bySector.length}</div>
              </div>
              <div className="metric">
                <div className="label">Diversification</div>
                <div className="value">{analysis.diversificationScore}/100</div>
                <div className="divscore">
                  <div className="divbar">
                    <span style={{ width: `${analysis.diversificationScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <PortfolioForm onAdded={() => void reload()} />
            <div style={{ marginTop: 18 }}>
              {prices.lastUpdated && (
                <div className="prices-ts">
                  Prices as of {toISTString(prices.lastUpdated)}
                </div>
              )}
              <Holdings
                holdings={holdings}
                byStock={analysis.byStock}
                prices={prices.prices}
                onChange={() => void reload()}
              />
            </div>
          </section>

          <section className="card delay-2">
            <div className="card-head">
              <span className="icon">
                <Gauge size={18} />
              </span>
              <h2>Sector Allocation</h2>
            </div>
            <AllocationChart bySector={analysis.bySector} />
          </section>

          <section className="card delay-3">
            <div className="card-head">
              <span className="icon">
                <Scale size={18} />
              </span>
              <h2>Rebalancing Suggestions</h2>
              <span className="count">strong, but only suggestions</span>
            </div>
            <Rebalance items={analysis.rebalance} />
          </section>

          <section className="card delay-4">
            <div className="card-head">
              <span className="icon">
                <Lightbulb size={18} />
              </span>
              <h2>Stocks to Consider</h2>
              <span className="count">{analysis.suggestions.length} ideas</span>
            </div>
            <Suggestions
              suggestions={analysis.suggestions}
              hasHoldings={holdings.length > 0}
            />
          </section>
        </div>

        {/* Right column */}
        <div className="col">
          <section className="card delay-2">
            <div className="disclaimer">
              <strong>Not investment advice.</strong> Dhan Advisor is an educational
              research tool. It is not a SEBI-registered investment adviser, and the
              ideas and rebalancing notes here are suggestions for your own research —
              not recommendations to buy or sell. Markets carry risk; please consult a
              qualified, registered financial adviser before acting.
            </div>
          </section>

          <section className="card delay-3" style={{ flex: 1 }}>
            <div className="card-head">
              <span className="icon">
                <Newspaper size={18} />
              </span>
              <h2>Verified Market Feed</h2>
              {news && (
                <span className="count">
                  {news.verifiedCount} kept · {news.rejectedCount} filtered
                </span>
              )}
            </div>
            {news && <NewsFeed news={news} />}
          </section>

          <section className="card delay-4">
            <div className="card-head">
              <span className="icon">
                <Mail size={18} />
              </span>
              <h2>Your Inbox — Stock Mentions</h2>
              {emailState.data.length > 0 && (
                <span className="count">
                  {emailState.data.length} holding{emailState.data.length !== 1 ? 's' : ''} with mail
                </span>
              )}
            </div>
            <EmailAnalysis emailState={emailState} onRefresh={() => void refreshEmails()} />
          </section>
        </div>

        {/* Third column — AI stock search */}
        <div className="col">
          <section className="card delay-2">
            <div className="card-head">
              <span className="icon">
                <Search size={18} />
              </span>
              <h2>Ask About Stocks</h2>
              <span className="count">Gemini + Yahoo Finance</span>
            </div>
            <StockSearch />
          </section>
        </div>
      </div>

      <footer className="footer-note">
        Dhan Advisor · suggestions only, not financial advice · news limited to a
        whitelist of reputable Indian financial publishers · your portfolio stays on
        this device
      </footer>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={(patch) => void saveSettings(patch)}
        />
      )}
    </div>
  )
}

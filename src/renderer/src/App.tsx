import { useCallback, useEffect, useState } from 'react'
import {
  Gauge,
  Lightbulb,
  Newspaper,
  RefreshCw,
  Scale,
  Settings as SettingsIcon,
  Wallet
} from 'lucide-react'
import type { Analysis, Holding, NewsState, Settings } from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../shared/types'
import PortfolioForm from './components/PortfolioForm'
import Holdings from './components/Holdings'
import AllocationChart from './components/AllocationChart'
import Suggestions from './components/Suggestions'
import Rebalance from './components/Rebalance'
import NewsFeed from './components/NewsFeed'
import SettingsModal from './components/SettingsModal'
import { inr, timeAgo } from './util'

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
  const [showSettings, setShowSettings] = useState(false)

  const reload = useCallback(async () => {
    const [h, a, n] = await Promise.all([
      window.api.getHoldings(),
      window.api.getAnalysis(),
      window.api.getNews()
    ])
    setHoldings(h)
    setAnalysis(a)
    setNews(n)
  }, [])

  useEffect(() => {
    void reload()
    window.api.getSettings().then(setSettings)
    const off = window.api.onDataUpdated(() => void reload())
    return off
  }, [reload])

  const refreshNow = async (): Promise<void> => {
    await window.api.refreshNews()
    void reload()
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
              <Holdings
                holdings={holdings}
                byStock={analysis.byStock}
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

import { ShieldCheck } from 'lucide-react'
import type { StockSuggestion } from '../../../shared/types'

interface Props {
  suggestions: StockSuggestion[]
  hasHoldings: boolean
}

export default function Suggestions({ suggestions, hasHoldings }: Props): JSX.Element {
  if (suggestions.length === 0) {
    return (
      <div className="empty" style={{ padding: '24px 10px' }}>
        {hasHoldings
          ? 'Gathering verified coverage… ideas will populate as background research completes.'
          : 'Add a few holdings to get diversification-aware ideas, refined by verified news.'}
      </div>
    )
  }

  return (
    <div>
      {suggestions.map((s) => (
        <div className="sug" key={s.symbol}>
          <div className="sug-head">
            <span className="sym">{s.symbol}</span>
            <span className="nm">{s.name}</span>
            <span className="chip" style={{ marginLeft: 8 }}>
              {s.sector}
            </span>
            <span className="score">fit {s.score}</span>
          </div>
          <ul className="sug-reasons">
            {s.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          {s.evidence.length > 0 && (
            <div className="evidence">
              <div className="ev-label">
                <ShieldCheck
                  size={11}
                  style={{ verticalAlign: -1, marginRight: 4, color: 'var(--pos)' }}
                />
                Backed by verified sources
              </div>
              {s.evidence.slice(0, 3).map((e, i) => (
                <a key={i} href={e.link} target="_blank" rel="noreferrer">
                  {e.title} <span className="src">· {e.sourceName}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

import { useRef, useState } from 'react'
import { Search, SendHorizonal } from 'lucide-react'

interface Result {
  answer?: string
  error?: string
}

export default function StockSearch(): JSX.Element {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const ask = async (): Promise<void> => {
    const q = query.trim()
    if (!q || loading) return
    setLoading(true)
    setResult(null)
    const res = await window.api.searchStock(q)
    setResult(res)
    setLoading(false)
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') void ask()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
              pointerEvents: 'none'
            }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="e.g. How is RELIANCE doing today?"
            style={{
              width: '100%',
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              padding: '9px 12px 9px 30px',
              color: 'var(--text)',
              fontSize: 13,
              outline: 'none'
            }}
            disabled={loading}
          />
        </div>
        <button
          className="primary-btn"
          style={{ padding: '9px 14px', fontSize: 13 }}
          onClick={() => void ask()}
          disabled={loading || !query.trim()}
        >
          <SendHorizonal size={13} />
          {loading ? 'Asking…' : 'Ask'}
        </button>
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: '8px 2px' }}>
          Fetching market data and asking Gemini…
        </div>
      )}

      {result && !loading && (
        <div
          style={{
            background: 'var(--bg-raised)',
            border: `1px solid ${result.error ? 'var(--neg)' : 'var(--line-soft)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
            fontSize: 13,
            lineHeight: 1.6,
            color: result.error ? 'var(--neg)' : 'var(--text)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {result.error ?? result.answer}
        </div>
      )}

      {!result && !loading && (
        <div style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.6 }}>
          Ask anything about Indian stocks — current price, fundamentals, comparisons.
          Gemini Flash fetches live data from Yahoo Finance to answer.
          <br />
          <span style={{ opacity: 0.6 }}>
            Requires a Gemini API key in Settings (free tier works).
          </span>
        </div>
      )}
    </div>
  )
}

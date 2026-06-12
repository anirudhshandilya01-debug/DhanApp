import { Mail, RefreshCw } from 'lucide-react'
import type { EmailAnalysisState } from '../../../shared/types'
import { timeAgo } from '../util'

interface Props {
  emailState: EmailAnalysisState
  onRefresh: () => void
}

export default function EmailAnalysis({ emailState, onRefresh }: Props): JSX.Element {
  const { data, isFetching, error, lastUpdated } = emailState
  const totalEmails = data.reduce((n, s) => n + s.emails.length, 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {lastUpdated && !isFetching && (
          <span style={{ fontSize: 11, opacity: 0.5 }}>
            scanned {timeAgo(lastUpdated)}
          </span>
        )}
        <button
          className="ghost-btn"
          style={{ marginLeft: 'auto', padding: '3px 10px', fontSize: 12 }}
          onClick={onRefresh}
          disabled={isFetching}
        >
          <RefreshCw size={12} className={isFetching ? 'spin' : ''} />
          {isFetching ? 'Scanning…' : 'Scan inbox'}
        </button>
      </div>

      {error && (
        <div className="empty" style={{ padding: '12px 4px', color: '#e05c5c' }}>
          {error}
        </div>
      )}

      {!isFetching && !error && data.length === 0 && (
        <div className="empty" style={{ padding: '16px 4px' }}>
          {lastUpdated
            ? 'No relevant emails found for your holdings in the last 90 days.'
            : 'Click "Scan inbox" to search your Gmail for emails about your holdings.'}
        </div>
      )}

      {data.length > 0 && (
        <div style={{ fontSize: 11, opacity: 0.45, marginBottom: 10 }}>
          {totalEmails} email{totalEmails !== 1 ? 's' : ''} across {data.length} holding{data.length !== 1 ? 's' : ''}
        </div>
      )}

      {data.map((stock) => (
        <div key={stock.symbol} style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#d4a85a' }}>
            {stock.symbol}
            <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 6, fontSize: 11 }}>
              {stock.name}
            </span>
            <span style={{ fontWeight: 400, opacity: 0.4, marginLeft: 6, fontSize: 11 }}>
              {stock.emails.length} email{stock.emails.length !== 1 ? 's' : ''}
            </span>
          </div>

          {stock.emails.map((email, i) => (
            <div
              key={i}
              className="news-item"
              style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div style={{ fontWeight: 500, fontSize: 12, marginBottom: 3 }}>
                {email.subject}
              </div>
              <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 3, lineHeight: 1.4 }}>
                {email.snippet}
              </div>
              <div className="news-meta">
                <span className="src">{email.sender.replace(/<.*>/, '').trim()}</span>
                {email.date && (
                  <span className="time">{email.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

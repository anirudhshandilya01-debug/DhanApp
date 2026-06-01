import { ShieldCheck } from 'lucide-react'
import type { NewsState } from '../../../shared/types'
import { timeAgo } from '../util'

interface Props {
  news: NewsState
}

export default function NewsFeed({ news }: Props): JSX.Element {
  return (
    <div>
      <div className="sources-strip">
        {news.sources.map((s) => (
          <span className="src-chip" key={s.id} title={`Trust weight ${s.trustWeight}`}>
            {s.name.split('—')[0].trim()}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        {news.recent.length === 0 && (
          <div className="empty" style={{ padding: '20px 4px' }}>
            {news.lastError
              ? news.lastError
              : 'Fetching verified market coverage in the background…'}
          </div>
        )}
        {news.recent.slice(0, 18).map((h, i) => (
          <div className="news-item" key={i}>
            <a href={h.link} target="_blank" rel="noreferrer">
              {h.title}
            </a>
            <div className="news-meta">
              <span className="verified-badge">
                <ShieldCheck size={10} /> verified
              </span>
              <span className="src">{h.sourceName.split('—')[0].trim()}</span>
              <span className="time">{timeAgo(h.publishedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

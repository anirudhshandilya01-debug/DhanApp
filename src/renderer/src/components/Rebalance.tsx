import { AlertTriangle, Info, TrendingUp } from 'lucide-react'
import type { RebalanceSuggestion } from '../../../shared/types'

interface Props {
  items: RebalanceSuggestion[]
}

function iconFor(sev: RebalanceSuggestion['severity']): JSX.Element {
  if (sev === 'info') return <Info size={17} />
  if (sev === 'low') return <TrendingUp size={17} />
  return <AlertTriangle size={17} />
}

export default function Rebalance({ items }: Props): JSX.Element {
  if (items.length === 0) {
    return (
      <div className="empty" style={{ padding: '20px 10px' }}>
        Rebalancing suggestions appear once you have holdings.
      </div>
    )
  }
  return (
    <div>
      {items.map((r) => (
        <div className={`reb ${r.severity}`} key={r.id}>
          <span className="ico">{iconFor(r.severity)}</span>
          <div>
            <div className="t">{r.title}</div>
            <div className="d">{r.detail}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { AllocationSlice, Holding } from '../../../shared/types'
import { inrExact } from '../util'

interface Props {
  holdings: Holding[]
  byStock: AllocationSlice[]
  onChange: () => void
}

export default function Holdings({ holdings, byStock, onChange }: Props): JSX.Element {
  const pctFor = (symbol: string): number =>
    byStock.find((s) => s.key === symbol)?.pct ?? 0

  if (holdings.length === 0) {
    return (
      <div className="empty">
        <div className="big">No holdings yet</div>
        Add the Indian stocks you're invested in above — symbol and the amount in INR.
        Everything else (allocation, ideas, rebalancing) flows from there.
      </div>
    )
  }

  return (
    <div className="holdings">
      <div className="hrow head">
        <span>Holding</span>
        <span>Sector</span>
        <span style={{ textAlign: 'right' }}>Invested</span>
        <span style={{ textAlign: 'right' }}>Weight</span>
        <span />
      </div>
      {holdings.map((h) => (
        <Row key={h.id} h={h} pct={pctFor(h.symbol)} onChange={onChange} />
      ))}
    </div>
  )
}

function Row({
  h,
  pct,
  onChange
}: {
  h: Holding
  pct: number
  onChange: () => void
}): JSX.Element {
  const [val, setVal] = useState(String(h.investedInr))

  const commit = async (): Promise<void> => {
    const n = Number(val)
    if (Number.isFinite(n) && n >= 0 && n !== h.investedInr) {
      await window.api.updateHolding(h.id, { investedInr: n })
      onChange()
    }
  }

  return (
    <div className="hrow">
      <div className="name">
        <span className="sym">{h.symbol}</span>
        <span className="nm">{h.name}</span>
      </div>
      <span className="chip">{h.sector}</span>
      <div className="amt">
        <input
          className="mono"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {inrExact(h.investedInr)}
        </span>
      </div>
      <span className="pct">{pct.toFixed(1)}%</span>
      <button
        className="icon-btn"
        title="Remove holding"
        onClick={async () => {
          await window.api.removeHolding(h.id)
          onChange()
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

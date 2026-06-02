import { useEffect, useRef, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import type { UniverseStock } from '../../../shared/types'

interface Props {
  onAdded: () => void
}

export default function PortfolioForm({ onAdded }: Props): JSX.Element {
  const [symbol, setSymbol] = useState('')
  const [amount, setAmount] = useState('')
  const [matches, setMatches] = useState<UniverseStock[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [lookupErr, setLookupErr] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    if (symbol.trim().length === 0) {
      setMatches([])
      return
    }
    window.api.searchUniverse(symbol).then((res) => {
      if (active) setMatches(res)
    })
    return () => {
      active = false
    }
  }, [symbol])

  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const pick = (s: UniverseStock): void => {
    setSymbol(s.symbol)
    setOpen(false)
  }

  const submit = async (): Promise<void> => {
    const sym = symbol.trim().toUpperCase()
    const amt = Number(amount)
    if (!sym || !Number.isFinite(amt) || amt <= 0) return
    setBusy(true)
    setLookupErr(null)

    // If the symbol is not in the local universe, validate it online before adding.
    const inLocal = matches.some((m) => m.symbol === sym)
    if (!inLocal) {
      const found = await window.api.lookupSymbol(sym)
      if (!found) {
        setLookupErr(`"${sym}" was not found on NSE. Please verify the symbol.`)
        setBusy(false)
        return
      }
    }

    await window.api.addHolding({ symbol: sym, investedInr: amt })
    setSymbol('')
    setAmount('')
    setLookupErr(null)
    setBusy(false)
    onAdded()
  }

  return (
    <div className="add-form" ref={boxRef}>
      <div className="field grow">
        <label>Stock (NSE symbol or name)</label>
        <input
          className="mono"
          placeholder="e.g. TCS, HDFCBANK, Reliance…"
          value={symbol}
          onChange={(e) => {
            setSymbol(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        {open && matches.length > 0 && (
          <div className="suggest-pop">
            {matches.map((m) => (
              <button key={m.symbol} onClick={() => pick(m)}>
                <Search size={13} style={{ color: 'var(--text-faint)' }} />
                <span className="sym">{m.symbol}</span>
                <span className="nm">{m.name}</span>
                <span className="sec">{m.sector}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="field">
        <label>Amount invested (INR)</label>
        <input
          className="mono"
          type="number"
          min="0"
          placeholder="50000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />
      </div>
      <button className="primary-btn" onClick={() => void submit()} disabled={busy}>
        <Plus size={16} /> {busy ? 'Validating…' : 'Add holding'}
      </button>
      {lookupErr && <p className="lookup-err">{lookupErr}</p>}
    </div>
  )
}

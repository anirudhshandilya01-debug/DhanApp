import { useState } from 'react'
import type { Settings } from '../../../shared/types'

interface Props {
  settings: Settings
  onClose: () => void
  onSave: (patch: Partial<Settings>) => void
}

export default function SettingsModal({ settings, onClose, onSave }: Props): JSX.Element {
  const [s, setS] = useState<Settings>(settings)

  const num = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS((prev) => ({ ...prev, [key]: Number(e.target.value) }))

  const str = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS((prev) => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2>Settings</h2>

        <div className="setting-row">
          <div className="info">
            <div className="t">Background refresh</div>
            <div className="d">How often verified news is re-fetched (minutes)</div>
          </div>
          <input type="number" min={1} value={s.refreshMinutes} onChange={num('refreshMinutes')} />
        </div>

        <div className="setting-row">
          <div className="info">
            <div className="t">News freshness window</div>
            <div className="d">Only consider headlines newer than this (hours)</div>
          </div>
          <input type="number" min={6} value={s.freshnessHours} onChange={num('freshnessHours')} />
        </div>

        <div className="setting-row">
          <div className="info">
            <div className="t">Max suggestions</div>
            <div className="d">How many stock ideas to surface</div>
          </div>
          <input type="number" min={1} max={20} value={s.maxSuggestions} onChange={num('maxSuggestions')} />
        </div>

        <div className="setting-row">
          <div className="info">
            <div className="t">Single-stock concentration flag</div>
            <div className="d">Warn when one stock exceeds this % of portfolio</div>
          </div>
          <input
            type="number"
            min={5}
            max={100}
            value={s.stockConcentrationPct}
            onChange={num('stockConcentrationPct')}
          />
        </div>

        <div className="setting-row">
          <div className="info">
            <div className="t">Single-sector concentration flag</div>
            <div className="d">Warn when one sector exceeds this % of portfolio</div>
          </div>
          <input
            type="number"
            min={10}
            max={100}
            value={s.sectorConcentrationPct}
            onChange={num('sectorConcentrationPct')}
          />
        </div>

        <div className="setting-row" style={{ alignItems: 'flex-start' }}>
          <div className="info">
            <div className="t">Gemini API key</div>
            <div className="d">
              Free key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                onClick={(e) => {
                  e.preventDefault()
                  window.open('https://aistudio.google.com/apikey')
                }}
                style={{ color: 'var(--gold-soft)' }}
              >
                aistudio.google.com
              </a>{' '}
              — powers the stock search column
            </div>
          </div>
          <input
            type="password"
            value={s.geminiApiKey}
            onChange={str('geminiApiKey')}
            placeholder="AIza…"
            style={{ width: 200, textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
        </div>

        <div className="modal-actions">
          <button className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={() => onSave(s)}
            style={{ alignSelf: 'auto' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

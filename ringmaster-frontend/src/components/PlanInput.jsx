// src/components/PlanInput.jsx
import { useState } from 'react'

export default function PlanInput({ onPlan, loading, darkMode }) {
  const defaultDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })()

  const [origin,      setOrigin]      = useState('')
  const [destination, setDestination] = useState('')
  const [date,        setDate]        = useState(defaultDate)
  const [duration,    setDuration]    = useState('7')

  const inputCls = `
    w-full border text-sm sm:text-base px-3 py-2.5 outline-none
    transition-all duration-200 rounded-md font-body
    focus:ring-2 focus:ring-gold/30 focus:border-gold
    ${darkMode
      ? 'bg-white/5 border-gold/20 text-parchment placeholder:text-parchment/20'
      : 'bg-white border-gold/30 text-[#1a1008] placeholder:text-[#1a1008]/30'
    }
  `

  const selectCls = `
    w-full border text-sm sm:text-base px-3 py-2.5 outline-none
    transition-all duration-200 rounded-md font-body
    focus:ring-2 focus:ring-gold/30 focus:border-gold
    ${darkMode
      ? 'bg-[#1a1008] border-gold/20 text-parchment'
      : 'bg-white border-gold/30 text-[#1a1008]'
    }
  `

  function handleSubmit() {
    if (!destination.trim() || !origin.trim()) return
    onPlan({ origin: origin.trim(), destination: destination.trim(), date, duration: Number(duration) })
  }

  return (
    <div className="glass-card p-4 sm:p-6">
      <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-gold opacity-70 mb-4">
        ◈ Plan Your Tour
      </p>

      {/* Row 1 — Origin + Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Field label="Travelling From">
          <input
            type="text"
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Delhi, Bangalore…"
            className={inputCls}
          />
        </Field>
        <Field label="Destination">
          <input
            type="text"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Goa, Shimla…"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Row 2 — Date + Duration + Button */}
      <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <Field label="Travel Date">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={inputCls + ' [color-scheme:dark]'}
          />
        </Field>

        <Field label="Duration">
          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className={selectCls}
          >
            {[2,3,4,5,7,10].map(d => (
              <option key={d} value={d}>{d} Days</option>
            ))}
          </select>
        </Field>

        <button
          onClick={handleSubmit}
          disabled={loading || !destination.trim() || !origin.trim()}
          className="col-span-2 sm:col-span-1 relative overflow-hidden px-5 py-2.5 font-display font-bold text-sm sm:text-base tracking-wide rounded-md text-parchment transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{
            background: 'linear-gradient(135deg, #8b1a1a 0%, #6b1515 100%)',
            border: '1px solid rgba(196,43,43,0.4)',
          }}
        >
          {/* Shimmer on hover */}
          <span className="relative z-10">
            {loading ? '⏳ Planning…' : '✦ Forge the Plan'}
          </span>
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] sm:text-[11px] tracking-wider uppercase text-silver">
        {label}
      </label>
      {children}
    </div>
  )
}
// src/components/PlanInput.jsx
import { useState } from 'react'

export default function PlanInput({ onPlan, loading }) {
  const defaultDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })()

  const [destination, setDestination] = useState('')
  const [date, setDate]               = useState(defaultDate)
  const [duration, setDuration]       = useState('7')

  function handleSubmit() {
    if (!destination.trim()) return
    onPlan({ destination: destination.trim(), date, duration: Number(duration) })
  }

  return (
    <div className="glass-card p-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-gold opacity-70 mb-4">
        ◈ Plan Your Tour
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end">
        {/* Destination */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[11px] tracking-wider uppercase text-silver">
            Destination
          </label>
          <input
            type="text"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Goa, Shimla, Pondicherry…"
            className="bg-white/5 border border-gold/20 focus:border-gold text-parchment px-3 py-2 font-body text-base outline-none transition-colors placeholder:text-parchment/20 rounded-sm"
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[11px] tracking-wider uppercase text-silver">
            Travel Date
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-white/5 border border-gold/20 focus:border-gold text-parchment px-3 py-2 font-body text-base outline-none transition-colors rounded-sm [color-scheme:dark]"
          />
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[11px] tracking-wider uppercase text-silver">
            Duration
          </label>
          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="bg-[#1a1008] border border-gold/20 focus:border-gold text-parchment px-3 py-2 font-body text-base outline-none transition-colors rounded-sm"
          >
            {[2,3,4,5,7,10].map(d => (
              <option key={d} value={d}>{d} Days</option>
            ))}
          </select>
        </div>

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !destination.trim()}
          className="bg-gradient-to-br from-crimson to-[#6b1515] border border-crimson-light/40 text-parchment px-6 py-2 font-display font-bold text-base tracking-wide rounded-sm transition-all hover:from-crimson-light hover:to-crimson hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
        >
          {loading ? '⏳ Planning…' : '✦ Forge the Plan'}
        </button>
      </div>
    </div>
  )
}
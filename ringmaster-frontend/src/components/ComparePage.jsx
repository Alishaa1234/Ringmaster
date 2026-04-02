// src/components/ComparePage.jsx
import { useState, useEffect, useRef } from 'react'
import { compareTrips } from '../services/api.js'
import { adaptResponse } from '../services/adapter.js'

// ── SCORING ──────────────────────────────────────────────────────────────────
function scoreDestination(plan) {
  let score = 0
  const breakdown = {}

  if (plan.budget) {
    // Lower budget = higher score (max 25)
    const mid = plan.budget.totalEstimate.mid
    const budgetScore = Math.max(0, 25 - Math.floor(mid / 2000))
    breakdown.budget = Math.min(25, budgetScore)
    score += breakdown.budget
  } else breakdown.budget = 0

  if (plan.weather) {
    // Lower humidity + moderate temp = higher score (max 25)
    const humScore = Math.max(0, 25 - Math.floor(plan.weather.humidity / 5))
    breakdown.weather = Math.min(25, humScore)
    score += breakdown.weather
  } else breakdown.weather = 0

  if (plan.route) {
    // Closer = higher score (max 25)
    const distScore = Math.max(0, 25 - Math.floor(plan.route.distanceKm / 100))
    breakdown.route = Math.min(25, distScore)
    score += breakdown.route
  } else breakdown.route = 0

  if (plan.events) {
    // More events = higher score (max 25)
    const total = (plan.events.festivals?.length || 0) +
                  (plan.events.thingsToDo?.length || 0) +
                  (plan.events.hiddenGems?.length || 0)
    breakdown.events = Math.min(25, total * 3)
    score += breakdown.events
  } else breakdown.events = 0

  return { total: Math.min(100, score), breakdown }
}

function getBestForTags(plan, scores) {
  const tags = []
  if (scores.breakdown.budget >= 18)  tags.push({ label: 'Best for Budget',    icon: '💰' })
  if (scores.breakdown.weather >= 18) tags.push({ label: 'Best for Weather',   icon: '☀️' })
  if (scores.breakdown.route >= 18)   tags.push({ label: 'Easiest to Reach',   icon: '🚀' })
  if (scores.breakdown.events >= 18)  tags.push({ label: 'Most Things to Do',  icon: '🎭' })
  if (plan.weather?.humidity < 60)    tags.push({ label: 'Low Humidity',        icon: '💨' })
  if (plan.route?.distanceKm < 500)   tags.push({ label: 'Quick Getaway',       icon: '⚡' })
  if (plan.budget?.totalEstimate.low < 8000) tags.push({ label: 'Budget Friendly', icon: '🎒' })
  return tags.slice(0, 3)
}

// ── ANIMATED BAR ─────────────────────────────────────────────────────────────
function AnimatedBar({ value, max, color, label, prefix = '', suffix = '' }) {
  const [width, setWidth] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth((value / max) * 100)
    }, 300)
    return () => clearTimeout(timer)
  }, [value, max])

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-silver">{label}</span>
        <span className="font-display font-bold text-sm" style={{ color }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ── SCORE RING ────────────────────────────────────────────────────────────────
function ScoreRing({ score, color, size = 80 }) {
  const [animated, setAnimated] = useState(0)
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (animated / 100) * circ

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 400)
    return () => clearTimeout(t)
  }, [score])

  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      <circle
        cx="32" cy="32" r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
        style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
      />
      <text x="32" y="36" textAnchor="middle" fill={color}
        style={{ fontSize: '14px', fontFamily: 'serif', fontWeight: 'bold' }}>
        {score}
      </text>
    </svg>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ComparePage({ darkMode }) {
  const defaultDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })()

  const [origin,   setOrigin]   = useState('')
  const [destA,    setDestA]    = useState('')
  const [destB,    setDestB]    = useState('')
  const [date,     setDate]     = useState(defaultDate)
  const [duration, setDuration] = useState('5')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState(null)

  const inputCls = `w-full border text-sm px-3 py-2.5 outline-none transition-all duration-200 rounded-md font-body focus:ring-2 focus:ring-gold/30 focus:border-gold ${
    darkMode
      ? 'bg-white/5 border-gold/20 text-parchment placeholder:text-parchment/20'
      : 'bg-white border-gold/30 text-[#1a1008] placeholder:text-[#1a1008]/30'
  }`

  async function handleCompare() {
    if (!origin.trim() || !destA.trim() || !destB.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const raw = await compareTrips({
        origin: origin.trim(),
        destination_a: destA.trim(),
        destination_b: destB.trim(),
        travel_date: date,
        duration: Number(duration),
      })
      setResult({
        a:       adaptResponse(raw.destination_a),
        b:       adaptResponse(raw.destination_b),
        verdict: raw.verdict,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Header */}
      <div className="text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold opacity-60 mb-1">◈ Comparison Mode</p>
        <h2 className="font-display text-2xl sm:text-3xl font-black gold-text">Which destination wins?</h2>
        <p className={`font-body italic text-sm mt-1 ${darkMode ? 'text-silver' : 'text-[#6a5a50]'}`}>
          AI scores both destinations across weather, budget, distance and events
        </p>
      </div>

      {/* Input */}
      <div className="glass-card p-4 sm:p-6 space-y-3">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] tracking-wider uppercase text-silver">Travelling From</label>
          <input type="text" value={origin} onChange={e => setOrigin(e.target.value)}
            placeholder="e.g. Delhi, Mumbai…" className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] tracking-wider uppercase text-[#4a9eda]">⬡ Destination A</label>
            <input type="text" value={destA} onChange={e => setDestA(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCompare()}
              placeholder="e.g. Goa" className={inputCls}
              style={{ borderColor: destA ? 'rgba(74,158,218,0.6)' : '' }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] tracking-wider uppercase text-gold">⬡ Destination B</label>
            <input type="text" value={destB} onChange={e => setDestB(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCompare()}
              placeholder="e.g. Pondicherry" className={inputCls}
              style={{ borderColor: destB ? 'rgba(200,146,42,0.6)' : '' }} />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] tracking-wider uppercase text-silver">Travel Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className={inputCls + ' [color-scheme:dark]'} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] tracking-wider uppercase text-silver">Duration</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} className={inputCls}>
              {[2,3,4,5,7].map(d => <option key={d} value={d}>{d} Days</option>)}
            </select>
          </div>
          <button onClick={handleCompare}
            disabled={loading || !origin.trim() || !destA.trim() || !destB.trim()}
            className="col-span-2 sm:col-span-1 px-5 py-2.5 font-display font-bold text-sm rounded-md text-parchment transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{ background: 'linear-gradient(135deg,#1a5f6a,#124048)', border: '1px solid rgba(26,95,106,0.5)' }}>
            {loading ? '⏳ Comparing…' : '⚖ Compare Now'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold"
              style={{ animation: 'spin 1s linear infinite' }} />
            <div className="absolute inset-2 rounded-full border border-gold/20"
              style={{ animation: 'spin 1.5s linear infinite reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center text-xl">⚖</div>
          </div>
          <p className="font-display italic text-silver text-lg">The council weighs both destinations…</p>
          <p className="font-mono text-[10px] text-silver/40 mt-2 tracking-wider">Running full agent pipeline for both cities simultaneously</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="glass-card p-4 border-red-500/30 flex gap-3 items-start">
          <span className="text-red-400">⚠</span>
          <p className="font-body text-sm text-cream">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (() => {
        const scoreA = scoreDestination(result.a)
        const scoreB = scoreDestination(result.b)
        const tagsA  = getBestForTags(result.a, scoreA)
        const tagsB  = getBestForTags(result.b, scoreB)
        const winnerA = scoreA.total >= scoreB.total

        return (
          <div className="space-y-5 animate-fade-up">

            {/* ── SCORE CARDS ── */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { plan: result.a, score: scoreA, tags: tagsA, color: '#4a9eda', winner: winnerA },
                { plan: result.b, score: scoreB, tags: tagsB, color: '#c8922a', winner: !winnerA },
              ].map(({ plan, score, tags, color, winner }, i) => (
                <div key={i} className="glass-card p-4 sm:p-5 relative overflow-hidden"
                  style={{ borderColor: color, borderWidth: '1px' }}>
                  {winner && (
                    <div className="absolute top-3 right-3 font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full"
                      style={{ background: color, color: '#0f0a05' }}>
                      🏆 Winner
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <ScoreRing score={score.total} color={color} size={70} />
                    <div>
                      <div className="font-mono text-[9px] tracking-widest uppercase mb-0.5" style={{ color }}>
                        Score / 100
                      </div>
                      <div className="font-display font-bold text-lg sm:text-xl text-parchment leading-tight">
                        {plan.destination}
                      </div>
                      <div className="font-mono text-[10px] text-silver">{plan.duration} days · from {plan.origin}</div>
                    </div>
                  </div>
                  {/* Best for tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, j) => (
                      <span key={j} className="font-mono text-[9px] tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
                        {tag.icon} {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── HEAD TO HEAD TABLE ── */}
            <div className="glass-card overflow-hidden">
              <div className="px-4 sm:px-6 py-3 border-b border-gold/20">
                <p className="font-mono text-[10px] tracking-widest uppercase text-gold opacity-70">
                  ◈ Head-to-Head Comparison
                </p>
              </div>
              <div className="divide-y divide-gold/10">
                {[
                  {
                    category: '☁ Weather',
                    aVal: result.a.weather ? `${result.a.weather.condition} · ${result.a.weather.tempHigh}°C` : '—',
                    bVal: result.b.weather ? `${result.b.weather.condition} · ${result.b.weather.tempHigh}°C` : '—',
                    aWins: (result.a.weather?.humidity || 99) < (result.b.weather?.humidity || 99),
                  },
                  {
                    category: '💧 Humidity',
                    aVal: result.a.weather ? `${result.a.weather.humidity}%` : '—',
                    bVal: result.b.weather ? `${result.b.weather.humidity}%` : '—',
                    aWins: (result.a.weather?.humidity || 99) < (result.b.weather?.humidity || 99),
                  },
                  {
                    category: '💰 Budget (mid)',
                    aVal: result.a.budget ? `₹${result.a.budget.totalEstimate.mid.toLocaleString()}` : '—',
                    bVal: result.b.budget ? `₹${result.b.budget.totalEstimate.mid.toLocaleString()}` : '—',
                    aWins: (result.a.budget?.totalEstimate.mid || 99999) < (result.b.budget?.totalEstimate.mid || 99999),
                  },
                  {
                    category: '✈ Transport cost',
                    aVal: result.a.budget ? `₹${result.a.budget.transport.mid.toLocaleString()}` : '—',
                    bVal: result.b.budget ? `₹${result.b.budget.transport.mid.toLocaleString()}` : '—',
                    aWins: (result.a.budget?.transport.mid || 99999) < (result.b.budget?.transport.mid || 99999),
                  },
                  {
                    category: '📍 Distance',
                    aVal: result.a.route ? `${result.a.route.distanceKm} km` : '—',
                    bVal: result.b.route ? `${result.b.route.distanceKm} km` : '—',
                    aWins: (result.a.route?.distanceKm || 99999) < (result.b.route?.distanceKm || 99999),
                  },
                  {
                    category: '🎭 Festivals',
                    aVal: result.a.events ? `${result.a.events.festivals?.length || 0} events` : '—',
                    bVal: result.b.events ? `${result.b.events.festivals?.length || 0} events` : '—',
                    aWins: (result.a.events?.festivals?.length || 0) >= (result.b.events?.festivals?.length || 0),
                  },
                  {
                    category: '✨ Things to do',
                    aVal: result.a.events ? `${result.a.events.thingsToDo?.length || 0} activities` : '—',
                    bVal: result.b.events ? `${result.b.events.thingsToDo?.length || 0} activities` : '—',
                    aWins: (result.a.events?.thingsToDo?.length || 0) >= (result.b.events?.thingsToDo?.length || 0),
                  },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 py-3 hover:bg-gold/5 transition-colors">
                    <div className={`text-sm font-body text-right pr-3 ${row.aWins ? 'text-parchment font-bold' : 'text-silver'}`}>
                      {row.aWins && <span className="text-[#4a9eda] mr-1">◆</span>}
                      {row.aVal}
                    </div>
                    <div className="font-mono text-[9px] tracking-wider uppercase text-silver text-center px-2 min-w-[80px] sm:min-w-[120px]">
                      {row.category}
                    </div>
                    <div className={`text-sm font-body pl-3 ${!row.aWins ? 'text-parchment font-bold' : 'text-silver'}`}>
                      {!row.aWins && <span className="text-gold mr-1">◆</span>}
                      {row.bVal}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── BUDGET BARS ── */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { plan: result.a, color: '#4a9eda' },
                { plan: result.b, color: '#c8922a' },
              ].map(({ plan, color }, i) => (
                <div key={i} className="glass-card p-4 sm:p-5">
                  <p className="font-mono text-[10px] tracking-widest uppercase mb-3" style={{ color }}>
                    {plan.destination} — Budget
                  </p>
                  {plan.budget ? (
                    <>
                      <AnimatedBar label="Budget stay"  value={plan.budget.totalEstimate.low}  max={100000} color={color} prefix="₹" />
                      <AnimatedBar label="Mid range"    value={plan.budget.totalEstimate.mid}  max={100000} color={color} prefix="₹" />
                      <AnimatedBar label="Luxury"       value={plan.budget.totalEstimate.high} max={100000} color={color} prefix="₹" />
                      <AnimatedBar label="Transport"    value={plan.budget.transport.mid}      max={20000}  color={color} prefix="₹" />
                      <AnimatedBar label="Food/day"     value={plan.budget.foodPerDay.mid}     max={3000}   color={color} prefix="₹" />
                    </>
                  ) : <p className="text-silver text-xs italic">No budget data</p>}
                </div>
              ))}
            </div>

            {/* ── SCORE BREAKDOWN ── */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { plan: result.a, score: scoreA, color: '#4a9eda' },
                { plan: result.b, score: scoreB, color: '#c8922a' },
              ].map(({ plan, score, color }, i) => (
                <div key={i} className="glass-card p-4 sm:p-5">
                  <p className="font-mono text-[10px] tracking-widest uppercase mb-3" style={{ color }}>
                    {plan.destination} — Score Breakdown
                  </p>
                  <AnimatedBar label="Budget score"  value={score.breakdown.budget}  max={25} color={color} suffix="/25" />
                  <AnimatedBar label="Weather score" value={score.breakdown.weather} max={25} color={color} suffix="/25" />
                  <AnimatedBar label="Route score"   value={score.breakdown.route}   max={25} color={color} suffix="/25" />
                  <AnimatedBar label="Events score"  value={score.breakdown.events}  max={25} color={color} suffix="/25" />
                </div>
              ))}
            </div>

            {/* ── AI VERDICT ── */}
            {result.verdict && (
              <div className="glass-card p-5 sm:p-6 border-gold/40">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-mono text-[10px] tracking-widest uppercase text-gold opacity-70">AI Verdict</p>
                    <p className="font-display font-bold text-lg text-parchment">The Council's Judgement</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {result.verdict.split('\n\n').filter(p => p.trim()).map((para, i) => (
                    <p key={i} className="font-body text-base leading-relaxed text-cream">{para}</p>
                  ))}
                </div>
                <p className="font-mono text-[9px] text-silver/40 mt-4 tracking-wider">Generated by GPT-4o mini via OpenRouter</p>
              </div>
            )}

          </div>
        )
      })()}
    </div>
  )
}
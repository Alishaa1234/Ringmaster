// src/App.jsx
import { useState, useEffect } from 'react'
import AgentCard    from './components/AgentCard.jsx'
import PlanInput    from './components/PlanInput.jsx'
import TabBar       from './components/TabBar.jsx'
import SummaryTab   from './components/tabs/SummaryTab.jsx'
import WeatherTab   from './components/tabs/WeatherTab.jsx'
import RouteTab     from './components/tabs/RouteTab.jsx'
import EventsTab    from './components/tabs/EventsTab.jsx'
import BudgetTab    from './components/tabs/BudgetTab.jsx'
import ItineraryTab from './components/tabs/ItineraryTab.jsx'
import { AGENTS }   from './data/mockData.js'
import { planTrip, checkHealth } from './services/api.js'
import { adaptResponse }         from './services/adapter.js'

const AGENT_SEQUENCE = [
  { id: 'weather', state: 'thinking', msg: 'Reading the skies…',  delay: 300 },
  { id: 'maps',    state: 'thinking', msg: 'Charting the roads…', delay: 600 },
  { id: 'budget',  state: 'thinking', msg: 'Counting the coins…', delay: 900 },
]

const LOADING_MSGS = [
  'The council convenes…',
  'Sky Gazer reads the clouds…',
  'Trailblazer charts the roads…',
  'Quartermaster counts the coins…',
  'Forging your perfect tour…',
]

export default function App() {
  const [agentStatus, setAgentStatus] = useState({})
  const [loading,     setLoading]     = useState(false)
  const [loadingMsg,  setLoadingMsg]  = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const [plan,        setPlan]        = useState(null)
  const [activeTab,   setActiveTab]   = useState('summary')
  const [backendOk,   setBackendOk]   = useState(null)
  const [error,       setError]       = useState(null)
  const [darkMode,    setDarkMode]    = useState(true)

  // Apply dark/light class to body
  useEffect(() => {
    document.body.classList.toggle('light', !darkMode)
  }, [darkMode])

  useEffect(() => {
    checkHealth().then(ok => setBackendOk(ok))
  }, [])

  function resetAgents() { setAgentStatus({}) }

  function setAgent(id, state, msg) {
    setAgentStatus(prev => ({ ...prev, [id]: { state, msg } }))
  }

  function markAllDone(timings) {
    setAgentStatus({
      weather: { state: 'done', msg: `Forecast ready (${timings?.weather_ms ?? '—'}ms)` },
      maps:    { state: 'done', msg: `Routes charted (${timings?.route_ms ?? '—'}ms)` },
      budget:  { state: 'done', msg: `Budget tallied (${timings?.budget_ms ?? '—'}ms)` },
    })
  }

  async function handlePlan({ origin, destination, date, duration }) {
    resetAgents()
    setPlan(null)
    setError(null)
    setLoading(true)
    setLoadingStep(0)
    setLoadingMsg(LOADING_MSGS[0])

    let msgIdx = 1
    const msgTimer = setInterval(() => {
      const idx = Math.min(msgIdx++, LOADING_MSGS.length - 1)
      setLoadingMsg(LOADING_MSGS[idx])
      setLoadingStep(idx)
    }, 900)

    AGENT_SEQUENCE.forEach(({ id, state, msg, delay }) => {
      setTimeout(() => setAgent(id, state, msg), delay)
    })

    try {
      const raw = await planTrip({ origin, destination, travel_date: date, duration })
      clearInterval(msgTimer)
      markAllDone(raw.meta)
      setPlan(adaptResponse(raw))
      setActiveTab('summary')
      setBackendOk(true)
    } catch (err) {
      clearInterval(msgTimer)
      resetAgents()
      setError(err.message)
      setBackendOk(false)
    } finally {
      setLoading(false)
    }
  }

  const tabContent = plan && {
    summary:   <SummaryTab   plan={plan} />,
    weather:   <WeatherTab   weather={plan.weather} />,
    route:     <RouteTab     route={plan.route} />,
    events:    <EventsTab    events={plan.events} />,
    budget:    <BudgetTab    budget={plan.budget} duration={plan.duration} />,
    itinerary: <ItineraryTab itinerary={plan.itinerary} />,
  }

  const bg = darkMode
    ? 'bg-[#0f0a05]'
    : 'bg-[#fdf6e8]'

  return (
    <div className={`min-h-screen relative ${bg} transition-colors duration-300`}>

      {/* Background texture */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: darkMode
            ? 'radial-gradient(ellipse at 20% 10%,rgba(139,26,26,0.15) 0%,transparent 50%),radial-gradient(ellipse at 80% 90%,rgba(26,95,106,0.15) 0%,transparent 50%)'
            : 'radial-gradient(ellipse at 20% 10%,rgba(200,146,42,0.08) 0%,transparent 50%)',
        }}/>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage:'repeating-linear-gradient(0deg,#c8922a 0,#c8922a 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#c8922a 0,#c8922a 1px,transparent 1px,transparent 60px)'
        }}/>
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-10 text-center pt-8 sm:pt-12 pb-5 sm:pb-7 border-b border-gold/20 px-4">
        {/* Dark/light toggle */}
        <button
          onClick={() => setDarkMode(d => !d)}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full glass-card flex items-center justify-center text-base hover:scale-110 transition-transform"
          title="Toggle dark/light mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.4em] sm:tracking-[0.5em] uppercase text-gold opacity-60 mb-2">
          ✦ The Grand Orchestrator's Platform ✦
        </p>
        <h1
          className="font-display font-black gold-text leading-tight"
          style={{fontSize:'clamp(1.8rem,5vw,4rem)'}}
        >
          Ringmaster's Round Table
        </h1>
        <p className={`font-body italic mt-1.5 text-sm sm:text-base ${darkMode ? 'text-silver' : 'text-[#6a5a50]'}`}>
          Where Sky Gazer, Trailblazer & Quartermaster unite
        </p>

        <div className="flex items-center gap-3 max-w-xs mx-auto mt-3 sm:mt-4">
          <div className="flex-1 h-px bg-gold/20" />
          <span className="text-gold text-sm">⬡</span>
          <div className="flex-1 h-px bg-gold/20" />
        </div>

        {/* Backend status */}
        <div className="mt-3 flex justify-center">
          {backendOk === true  && <StatusBadge color="green" label="● Backend connected" />}
          {backendOk === false && <StatusBadge color="red"   label="● Backend offline — run uvicorn" />}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6">

        {/* Agent cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 stagger">
          {AGENTS.map(agent => (
            <AgentCard key={agent.id} agent={agent} status={agentStatus[agent.id]} />
          ))}
        </div>

        {/* Input */}
        <PlanInput onPlan={handlePlan} loading={loading} darkMode={darkMode} />

        {/* Error */}
        {error && !loading && (
          <div className="glass-card p-4 sm:p-5 border-red-500/30 flex gap-3 items-start animate-fade-up">
            <span className="text-red-400 text-lg shrink-0">⚠</span>
            <div>
              <p className="font-mono text-[10px] tracking-wider uppercase text-red-400 mb-1">
                Something went wrong
              </p>
              <p className="font-body text-sm" style={{color: darkMode ? '#f5ead4' : '#2a1a08'}}>
                {error}
              </p>
              {backendOk === false && (
                <p className="font-mono text-[10px] text-silver mt-2">
                  Start backend: <code className="text-gold">uvicorn main:app --reload</code>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-10 sm:py-14 animate-fade-up">
            {/* Orbital spinner */}
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold"
                style={{animation:'spin 1s linear infinite'}} />
              <div className="absolute inset-2 rounded-full border border-gold/20"
                style={{animation:'spin 1.5s linear infinite reverse'}} />
              <div className="absolute inset-0 flex items-center justify-center text-xl">
                🎪
              </div>
            </div>

            <p className="font-display italic text-silver text-base sm:text-lg mb-3">
              {loadingMsg}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              {LOADING_MSGS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width:  loadingStep === i ? '20px' : '6px',
                    height: '6px',
                    background: loadingStep >= i
                      ? '#c8922a'
                      : 'rgba(200,146,42,0.2)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Placeholder */}
        {!loading && !plan && !error && (
          <div className="text-center py-14 sm:py-20 animate-fade-up">
            <div className="text-4xl sm:text-5xl mb-4 opacity-40">🎪</div>
            <p className="font-body italic text-silver opacity-60 text-sm sm:text-base">
              Enter your destination and let the council craft your perfect tour
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && plan && (
          <div className="glass-card overflow-hidden animate-fade-up">
            {/* Source badges */}
            <div className="flex gap-2 px-4 sm:px-6 pt-3 sm:pt-4 flex-wrap">
              {plan.weather?.source && <SourceBadge label={plan.weather.source} />}
              {plan.route?.source   && <SourceBadge label={plan.route.source} />}
              {plan.budget?.source  && <SourceBadge label={plan.budget.source} />}
              {plan.meta?.total_ms  && <SourceBadge label={`${plan.meta.total_ms}ms`} dim />}
            </div>
            <TabBar active={activeTab} onChange={setActiveTab} />
            <div className="p-4 sm:p-6">
              {tabContent[activeTab]}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

function StatusBadge({ color, label }) {
  const cls = color === 'green'
    ? 'text-green-400 bg-green-400/10 border-green-400/20'
    : 'text-red-400 bg-red-400/10 border-red-400/20'
  return (
    <span className={`font-mono text-[9px] sm:text-[10px] tracking-wider uppercase px-3 py-1 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

function SourceBadge({ label, dim }) {
  return (
    <span className={`font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full border ${
      dim ? 'text-silver/50 border-gold/10' : 'text-gold/70 border-gold/20 bg-gold/5'
    }`}>
      {label}
    </span>
  )
}
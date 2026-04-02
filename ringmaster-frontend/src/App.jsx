// src/App.jsx
import { useState, useEffect, useRef } from 'react'
import AgentCard    from './components/AgentCard.jsx'
import PlanInput    from './components/PlanInput.jsx'
import TabBar       from './components/TabBar.jsx'
import ComparePage  from './components/ComparePage.jsx'
import SummaryTab   from './components/tabs/SummaryTab.jsx'
import WeatherTab   from './components/tabs/WeatherTab.jsx'
import RouteTab     from './components/tabs/RouteTab.jsx'
import EventsTab    from './components/tabs/EventsTab.jsx'
import BudgetTab    from './components/tabs/BudgetTab.jsx'
import ItineraryTab from './components/tabs/ItineraryTab.jsx'
import { AGENTS }       from './data/mockData.js'
import { planTripStream, checkHealth } from './services/api.js'
import { adaptResponse }               from './services/adapter.js'

// Maps WebSocket agent IDs → AgentCard IDs
const AGENT_ID_MAP = {
  weather:   'weather',
  route:     'maps',
  budget:    'budget',
  itinerary: 'budget', // shares budget card slot
  events:    'weather', // shares weather card slot
}

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
  const [page,        setPage]        = useState('plan')
  const cancelRef = useRef(null)

  useEffect(() => {
    document.body.classList.toggle('light', !darkMode)
  }, [darkMode])

  useEffect(() => {
    checkHealth().then(ok => setBackendOk(ok))
  }, [])

  function setAgent(cardId, state, msg) {
    setAgentStatus(prev => ({ ...prev, [cardId]: { state, msg } }))
  }

  function resetAgents() {
    setAgentStatus({})
  }

  async function handlePlan({ origin, destination, date, duration }) {
    // Cancel any in-flight request
    if (cancelRef.current) cancelRef.current()

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
    }, 1200)

    cancelRef.current = planTripStream(
      { origin, destination, travel_date: date, duration },
      {
        onAgentStart: (agentId, name, msg) => {
          const cardId = AGENT_ID_MAP[agentId] || 'weather'
          setAgent(cardId, 'thinking', `${name}: ${msg}`)
        },

        onAgentDone: (agentId, name, msg, ms) => {
          const cardId = AGENT_ID_MAP[agentId] || 'weather'
          setAgent(cardId, 'done', `✓ ${name} (${ms}ms)`)
        },

        onAgentError: (agentId, name, error) => {
          const cardId = AGENT_ID_MAP[agentId] || 'weather'
          setAgent(cardId, 'done', `⚠ ${name} used fallback`)
        },

        onComplete: (data) => {
          clearInterval(msgTimer)
          setLoading(false)
          setPlan(adaptResponse(data))
          setActiveTab('summary')
          setBackendOk(true)
        },

        onError: (err) => {
          clearInterval(msgTimer)
          setLoading(false)
          resetAgents()
          setError(err)
          setBackendOk(false)
        },
      }
    )
  }

  const tabContent = plan && {
    summary:   <SummaryTab   plan={plan} />,
    weather:   <WeatherTab   weather={plan.weather} />,
    route:     <RouteTab     route={plan.route} />,
    events:    <EventsTab    events={plan.events} />,
    budget:    <BudgetTab    budget={plan.budget} duration={plan.duration} />,
    itinerary: <ItineraryTab itinerary={plan.itinerary} />,
  }

  const bg = darkMode ? 'bg-[#0f0a05]' : 'bg-[#fdf6e8]'

  return (
    <div className={`min-h-screen relative ${bg} transition-colors duration-300`}>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: darkMode
            ? 'radial-gradient(ellipse at 20% 10%,rgba(139,26,26,0.15) 0%,transparent 50%),radial-gradient(ellipse at 80% 90%,rgba(26,95,106,0.15) 0%,transparent 50%)'
            : 'radial-gradient(ellipse at 20% 10%,rgba(200,146,42,0.08) 0%,transparent 50%)',
        }}/>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg,#c8922a 0,#c8922a 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#c8922a 0,#c8922a 1px,transparent 1px,transparent 60px)'
        }}/>
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-10 text-center pt-8 sm:pt-12 pb-5 sm:pb-7 border-b border-gold/20 px-4">
        <button
          onClick={() => setDarkMode(d => !d)}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full glass-card flex items-center justify-center text-base hover:scale-110 transition-transform"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.4em] uppercase text-gold opacity-60 mb-2">
          ✦ The Grand Orchestrator's Platform ✦
        </p>
        <h1 className="font-display font-black gold-text leading-tight"
          style={{fontSize:'clamp(1.8rem,5vw,4rem)'}}>
          Ringmaster's Round Table
        </h1>
        <p className={`font-body italic mt-1.5 text-sm sm:text-base ${darkMode ? 'text-silver' : 'text-[#6a5a50]'}`}>
          Where Sky Gazer, Trailblazer & Quartermaster unite
        </p>

        <div className="flex items-center gap-3 max-w-xs mx-auto mt-3">
          <div className="flex-1 h-px bg-gold/20" />
          <span className="text-gold text-sm">⬡</span>
          <div className="flex-1 h-px bg-gold/20" />
        </div>

        <div className="mt-3 flex justify-center gap-3 flex-wrap">
          {backendOk === true  && <StatusBadge color="green" label="● Backend connected" />}
          {backendOk === false && <StatusBadge color="red"   label="● Backend offline" />}
          {backendOk === true  && <StatusBadge color="green" label="⚡ WebSocket ready" />}
        </div>

        <div className="flex justify-center gap-2 mt-4">
          <PageBtn active={page === 'plan'}    onClick={() => setPage('plan')}    label="🗺 Plan Trip" />
          <PageBtn active={page === 'compare'} onClick={() => setPage('compare')} label="⚖ Compare" />
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6">

        {page === 'compare' && <ComparePage darkMode={darkMode} />}

        {page === 'plan' && (
          <>
            {/* Agent cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 stagger">
              {AGENTS.map(agent => (
                <AgentCard key={agent.id} agent={agent} status={agentStatus[agent.id]} />
              ))}
            </div>

            <PlanInput onPlan={handlePlan} loading={loading} darkMode={darkMode} />

            {/* Error */}
            {error && !loading && (
              <div className="glass-card p-4 sm:p-5 border-red-500/30 flex gap-3 items-start animate-fade-up">
                <span className="text-red-400 text-lg shrink-0">⚠</span>
                <div>
                  <p className="font-mono text-[10px] tracking-wider uppercase text-red-400 mb-1">Something went wrong</p>
                  <p className="font-body text-sm" style={{color: darkMode ? '#f5ead4' : '#2a1a08'}}>{error}</p>
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
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold"
                    style={{animation:'spin 1s linear infinite'}} />
                  <div className="absolute inset-2 rounded-full border border-gold/20"
                    style={{animation:'spin 1.5s linear infinite reverse'}} />
                  <div className="absolute inset-0 flex items-center justify-center text-xl">🎪</div>
                </div>
                <p className="font-display italic text-silver text-base sm:text-lg mb-3">{loadingMsg}</p>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-4">
                  {LOADING_MSGS.map((_, i) => (
                    <div key={i} className="rounded-full transition-all duration-300"
                      style={{
                        width:  loadingStep === i ? '20px' : '6px',
                        height: '6px',
                        background: loadingStep >= i ? '#c8922a' : 'rgba(200,146,42,0.2)',
                      }} />
                  ))}
                </div>

                {/* Live agent stream log */}
                <div className="max-w-xs mx-auto space-y-1">
                  {Object.entries(agentStatus).map(([id, status]) => (
                    <div key={id} className="flex items-center gap-2 text-left">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        status.state === 'done' ? 'bg-green-400' : 'bg-gold-light'
                      }`} style={status.state === 'thinking' ? {animation:'agentPulse 1s ease-in-out infinite'} : {}} />
                      <span className="font-mono text-[10px] text-silver truncate">{status.msg}</span>
                    </div>
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
                <div className="flex gap-2 px-4 sm:px-6 pt-3 sm:pt-4 flex-wrap">
                  {plan.weather?.source && <SourceBadge label={plan.weather.source} />}
                  {plan.route?.source   && <SourceBadge label={plan.route.source} />}
                  {plan.budget?.source  && <SourceBadge label={plan.budget.source} />}
                  {plan.meta?.total_ms  && <SourceBadge label={`${plan.meta.total_ms}ms`} dim />}
                </div>
                <TabBar active={activeTab} onChange={setActiveTab} />
                <div className="p-4 sm:p-6">{tabContent[activeTab]}</div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function PageBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick}
      className={`font-mono text-[10px] tracking-wider uppercase px-4 py-1.5 rounded-full border transition-all ${
        active
          ? 'text-gold border-gold/50 bg-gold/10'
          : 'text-silver border-silver/20 hover:border-gold/30 hover:text-parchment'
      }`}>
      {label}
    </button>
  )
}

function StatusBadge({ color, label }) {
  const cls = color === 'green'
    ? 'text-green-400 bg-green-400/10 border-green-400/20'
    : 'text-red-400 bg-red-400/10 border-red-400/20'
  return <span className={`font-mono text-[9px] sm:text-[10px] tracking-wider uppercase px-3 py-1 rounded-full border ${cls}`}>{label}</span>
}

function SourceBadge({ label, dim }) {
  return (
    <span className={`font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full border ${
      dim ? 'text-silver/50 border-gold/10' : 'text-gold/70 border-gold/20 bg-gold/5'
    }`}>{label}</span>
  )
}
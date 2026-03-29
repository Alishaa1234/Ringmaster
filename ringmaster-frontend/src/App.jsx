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
  { id: 'maps',    state: 'thinking', msg: 'Charting the roads…', delay: 500 },
  { id: 'budget',  state: 'thinking', msg: 'Counting the coins…', delay: 700 },
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
  const [plan,        setPlan]        = useState(null)
  const [activeTab,   setActiveTab]   = useState('summary')
  const [backendOk,   setBackendOk]   = useState(null)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    checkHealth().then(ok => setBackendOk(ok))
  }, [])

  function resetAgents() { setAgentStatus({}) }

  function setAgent(id, state, msg) {
    setAgentStatus(prev => ({ ...prev, [id]: { state, msg } }))
  }

  function markAllDone(timings) {
    setAgentStatus({
      weather: { state: 'done', msg: `☁ Forecast ready (${timings?.weather_ms ?? '—'}ms)` },
      maps:    { state: 'done', msg: `✓ Routes charted (${timings?.route_ms ?? '—'}ms)` },
      budget:  { state: 'done', msg: `✓ Budget tallied (${timings?.budget_ms ?? '—'}ms)` },
    })
  }

  async function handlePlan({ destination, date, duration }) {
    resetAgents()
    setPlan(null)
    setError(null)
    setLoading(true)
    setLoadingMsg(LOADING_MSGS[0])

    let msgIdx = 1
    const msgTimer = setInterval(() => {
      setLoadingMsg(LOADING_MSGS[Math.min(msgIdx++, LOADING_MSGS.length - 1)])
    }, 900)

    AGENT_SEQUENCE.forEach(({ id, state, msg, delay }) => {
      setTimeout(() => setAgent(id, state, msg), delay)
    })

    try {
      const raw = await planTrip({ destination, travel_date: date, duration })
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

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 20% 10%,rgba(139,26,26,0.15) 0%,transparent 50%),radial-gradient(ellipse at 80% 90%,rgba(26,95,106,0.15) 0%,transparent 50%)'}}/>
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'repeating-linear-gradient(0deg,#c8922a 0,#c8922a 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#c8922a 0,#c8922a 1px,transparent 1px,transparent 60px)'}}/>
      </div>

      <header className="relative z-10 text-center pt-10 pb-6 border-b border-gold/20 px-4">
        <p className="font-mono text-[11px] tracking-[0.5em] uppercase text-gold opacity-60 mb-2">✦ The Grand Orchestrator's Platform ✦</p>
        <h1 className="font-display font-black gold-text" style={{fontSize:'clamp(2.2rem,6vw,4rem)',lineHeight:1.1}}>
          Ringmaster's Round Table
        </h1>
        <p className="font-body italic text-silver mt-2 text-base">Where Sky Gazer, Trailblazer & Quartermaster unite</p>
        <div className="flex items-center gap-3 max-w-xs mx-auto mt-4">
          <div className="flex-1 h-px bg-gold/20" /><span className="text-gold">⬡</span><div className="flex-1 h-px bg-gold/20" />
        </div>
        <div className="mt-3 flex justify-center">
          {backendOk === true  && <StatusBadge color="green" label="● Backend connected — LangGraph ready" />}
          {backendOk === false && <StatusBadge color="red"   label="● Backend offline — run: uvicorn main:app --reload" />}
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {AGENTS.map(agent => (
            <AgentCard key={agent.id} agent={agent} status={agentStatus[agent.id]} />
          ))}
        </div>

        <PlanInput onPlan={handlePlan} loading={loading} />

        {error && !loading && (
          <div className="glass-card p-5 border-red-500/30 flex gap-3 items-start">
            <span className="text-red-400 text-lg">⚠</span>
            <div>
              <p className="font-mono text-[10px] tracking-wider uppercase text-red-400 mb-1">Something went wrong</p>
              <p className="font-body text-cream text-sm">{error}</p>
              {backendOk === false && (
                <p className="font-mono text-[10px] text-silver mt-2">
                  Start backend: <code className="text-gold">uvicorn main:app --reload</code>
                </p>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-gold/10 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="font-display italic text-silver text-lg">{loadingMsg}</p>
          </div>
        )}

        {!loading && !plan && !error && (
          <div className="text-center py-16 text-silver font-body italic opacity-50">
            <div className="text-5xl mb-4">🎪</div>
            Enter your destination and let the council craft your perfect tour
          </div>
        )}

        {!loading && plan && (
          <div className="glass-card overflow-hidden">
            <div className="flex gap-2 px-6 pt-4 flex-wrap">
              {plan.weather?.source && <SourceBadge label={plan.weather.source} />}
              {plan.route?.source   && <SourceBadge label={plan.route.source} />}
              {plan.budget?.source  && <SourceBadge label={plan.budget.source} />}
              {plan.meta?.total_ms  && <SourceBadge label={`${plan.meta.total_ms}ms`} dim />}
            </div>
            <TabBar active={activeTab} onChange={setActiveTab} />
            <div className="p-6">{tabContent[activeTab]}</div>
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
  return <span className={`font-mono text-[10px] tracking-wider uppercase px-3 py-1 rounded-full border ${cls}`}>{label}</span>
}

function SourceBadge({ label, dim }) {
  return (
    <span className={`font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full border ${
      dim ? 'text-silver/50 border-gold/10' : 'text-gold/70 border-gold/20 bg-gold/5'
    }`}>{label}</span>
  )
}
// src/components/tabs/EventsTab.jsx
export default function EventsTab({ events }) {
  return (
    <div className="animate-fade-up space-y-5">
      <PanelTitle icon="🎭" agent="Orchestrator" title="Events & Experiences" />

      <div className="grid md:grid-cols-2 gap-4">
        {/* Festivals */}
        <div className="glass-card p-5">
          <SectionTitle color="text-crimson-light">🎊 Festivals & Events</SectionTitle>
          <ul className="space-y-3">
            {events.festivals.map((f, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-gold mt-0.5 text-sm">◆</span>
                <span className="text-cream text-base leading-snug">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Highlights */}
        <div className="glass-card p-5">
          <SectionTitle color="text-teal-light">✨ Local Highlights</SectionTitle>
          <ul className="space-y-3">
            {events.highlights.map((h, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-teal-light mt-0.5 text-sm">◆</span>
                <span className="text-cream text-base leading-snug">{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Insider tip */}
      <div className="glass-card p-5 border-gold/30 flex gap-3 items-start">
        <span className="text-2xl">🎯</span>
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-gold mb-1">Insider Tip</p>
          <p className="text-cream text-base leading-relaxed">{events.tip}</p>
        </div>
      </div>

      {/* Placeholder for real Events API */}
      <div className="glass-card p-4 border-dashed border-gold/20 flex items-center gap-3">
        <span className="text-xl opacity-40">🔌</span>
        <p className="font-mono text-[10px] text-silver tracking-wider">
          LIVE EVENTS — TICKETMASTER / EVENTBRITE API COMING NEXT SPRINT
        </p>
      </div>
    </div>
  )
}

function SectionTitle({ children, color = 'text-gold' }) {
  return (
    <h3 className={`font-display font-bold text-base mb-4 border-l-2 border-gold pl-3 ${color}`}>
      {children}
    </h3>
  )
}

function PanelTitle({ icon, agent, title }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-gold opacity-60">{agent}</div>
        <h2 className="font-display text-xl font-bold text-parchment">{title}</h2>
      </div>
    </div>
  )
}
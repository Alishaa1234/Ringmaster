// src/components/tabs/EventsTab.jsx
export default function EventsTab({ events }) {
  if (!events) return <Placeholder />

  return (
    <div className="animate-fade-up space-y-5">
      <PanelTitle />

      {/* Festivals */}
      {events.festivals?.length > 0 && (
        <div className="glass-card p-5">
          <SectionTitle color="text-crimson-light">🎊 Festivals & events</SectionTitle>
          <div className="space-y-3">
            {events.festivals.map((f, i) => (
              <EventCard key={i} item={f} accent="#c42b2b" />
            ))}
          </div>
        </div>
      )}

      {/* Things to do */}
      {events.thingsToDo?.length > 0 && (
        <div className="glass-card p-5">
          <SectionTitle color="text-teal-light">✨ Things to do</SectionTitle>
          <div className="space-y-3">
            {events.thingsToDo.map((t, i) => (
              <EventCard key={i} item={t} accent="#2a8a99" showCategory />
            ))}
          </div>
        </div>
      )}

      {/* Hidden gems + Food — side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {events.hiddenGems?.length > 0 && (
          <div className="glass-card p-5">
            <SectionTitle color="text-gold">💎 Hidden gems</SectionTitle>
            <div className="space-y-3">
              {events.hiddenGems.map((g, i) => (
                <EventCard key={i} item={g} accent="#c8922a" />
              ))}
            </div>
          </div>
        )}

        {events.food?.length > 0 && (
          <div className="glass-card p-5">
            <SectionTitle color="text-gold-light">🍽 Local food</SectionTitle>
            <div className="space-y-3">
              {events.food.map((f, i) => (
                <EventCard key={i} item={f} accent="#e8b84b" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Insider tip */}
      {events.insiderTip && (
        <div className="glass-card p-5 border-gold/30 flex gap-3 items-start">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-gold mb-1">
              Insider tip
            </p>
            <p className="text-cream text-base leading-relaxed">{events.insiderTip}</p>
          </div>
        </div>
      )}

      {/* Source badge */}
      {events.source && (
        <p className="font-mono text-[10px] text-silver/40 tracking-wider text-right">
          {events.source}
        </p>
      )}
    </div>
  )
}

function EventCard({ item, accent, showCategory }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-1 rounded-full mt-1 shrink-0 h-full min-h-[40px]"
        style={{ background: accent, opacity: 0.6 }} />
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold text-parchment text-sm">{item.name}</span>
          {showCategory && item.category && (
            <span className="font-mono text-[9px] tracking-wider uppercase text-silver border border-silver/20 px-2 py-0.5 rounded-full">
              {item.category}
            </span>
          )}
          {item.date && (
            <span className="font-mono text-[9px] tracking-wider text-gold/70">
              {item.date}
            </span>
          )}
        </div>
        <p className="text-silver text-sm leading-relaxed mt-0.5">{item.description}</p>
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

function PanelTitle() {
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className="text-2xl">🎭</span>
      <div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-gold opacity-60">
          Events Agent
        </div>
        <h2 className="font-display text-xl font-bold text-parchment">
          Events & experiences
        </h2>
      </div>
    </div>
  )
}

function Placeholder() {
  return (
    <div className="text-center py-16 opacity-40">
      <div className="text-4xl mb-3">🎭</div>
      <p className="font-mono text-xs text-silver tracking-wider">No events data available</p>
    </div>
  )
}
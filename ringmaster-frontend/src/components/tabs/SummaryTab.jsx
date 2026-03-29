// src/components/tabs/SummaryTab.jsx
export default function SummaryTab({ plan }) {
  const { destination, duration, summary, weather, route, budget, events } = plan

  return (
    <div className="animate-fade-up space-y-5">
      {/* Hero */}
      <div className="glass-card p-6 border-gold/40">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-gold opacity-60 mb-2">
          Grand Tour Overview
        </p>
        <h2 className="font-display text-2xl font-bold gold-text mb-3">
          {destination}, India — {duration} Days
        </h2>
        <p className="font-body text-cream text-lg leading-relaxed italic">{summary}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon="🌡" label="Avg high"     value={weather ? `${weather.tempHigh}°C` : '—'} />
        <StatCard icon="📍" label="Distance"     value={route   ? `~${route.distanceKm} km` : '—'} />
        <StatCard icon="💰" label="Budget from"  value={budget  ? `₹${budget.totalEstimate.low.toLocaleString()}` : '—'} />
        <StatCard icon="🎭" label="Events"       value={events  ? `${events.festivals.length} lined up` : '—'} />
      </div>

      {/* Snapshots */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Weather snapshot */}
        {weather ? (
          <div className="glass-card p-5">
            <SectionTitle>☁ Weather snapshot</SectionTitle>
            <p className="text-cream text-base leading-relaxed mb-3">{weather.alert}</p>
            <div className="flex gap-2 flex-wrap">
              {weather.forecast.slice(0, 4).map((f, i) => (
                <div key={i} className="text-center bg-white/5 rounded-sm px-3 py-2">
                  <div className="text-xs text-silver font-mono">{f.day}</div>
                  <div className="text-xl my-1">{f.icon}</div>
                  <div className="text-xs text-gold-light font-mono">{f.high}°</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <PlaceholderCard icon="☁" label="Weather loading…" />
        )}

        {/* Route snapshot */}
        {route ? (
          <div className="glass-card p-5">
            <SectionTitle>🗺 Best route</SectionTitle>
            <p className="text-cream text-base mb-2">{route.from} → {route.to}</p>
            {route.transportOptions.filter(o => o.recommended).map((o, i) => (
              <div key={i} className="flex items-center justify-between bg-gold/10 border border-gold/20 px-3 py-2 rounded-sm mt-2">
                <span className="text-gold-light font-body">{o.mode}</span>
                <span className="font-mono text-xs text-silver">{o.duration}</span>
                <span className="font-mono text-xs text-cream">{o.cost}</span>
              </div>
            ))}
            <p className="text-silver text-sm italic mt-3">
              {route.scenicNote?.slice(0, 90)}…
            </p>
          </div>
        ) : (
          <PlaceholderCard icon="🗺" label="Route loading…" />
        )}
      </div>

      {/* Saving tip */}
      {budget?.savingTip && (
        <div className="glass-card p-5 border-gold/30 flex gap-3 items-start">
          <span className="text-xl mt-0.5">💡</span>
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-gold mb-1">Quartermaster's tip</p>
            <p className="text-cream text-base leading-relaxed">{budget.savingTip}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-mono text-[10px] tracking-widest uppercase text-silver mb-1">{label}</div>
      <div className="font-display font-bold text-gold-light text-lg">{value}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="font-display text-gold font-bold text-base mb-3 border-l-2 border-gold pl-3">
      {children}
    </h3>
  )
}

function PlaceholderCard({ icon, label }) {
  return (
    <div className="glass-card p-5 flex items-center justify-center gap-2 opacity-40 min-h-[120px]">
      <span className="text-xl">{icon}</span>
      <span className="font-mono text-xs text-silver tracking-wider">{label}</span>
    </div>
  )
}
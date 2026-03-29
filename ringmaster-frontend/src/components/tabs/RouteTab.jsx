// src/components/tabs/RouteTab.jsx
const STARS = [1,2,3,4,5]

export default function RouteTab({ route }) {
  return (
    <div className="animate-fade-up space-y-5">
      <PanelTitle icon="🗺" agent="Trailblazer" title="Route & Transport" />

      {/* Route header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-center">
            <div className="font-display font-bold text-xl text-parchment">{route.from}</div>
            <div className="font-mono text-[10px] text-silver uppercase tracking-wider mt-1">Origin</div>
          </div>
          <div className="flex-1 flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-px bg-gradient-to-r from-gold/20 via-gold/60 to-gold/20" />
            <div className="font-mono text-[10px] text-gold whitespace-nowrap">~{route.distanceKm} km</div>
            <div className="flex-1 h-px bg-gradient-to-r from-gold/20 via-gold/60 to-gold/20" />
          </div>
          <div className="text-center">
            <div className="font-display font-bold text-xl text-parchment">{route.to}</div>
            <div className="font-mono text-[10px] text-silver uppercase tracking-wider mt-1">Destination</div>
          </div>
        </div>
      </div>

      {/* Transport options */}
      <div className="glass-card p-5">
        <SectionTitle>Transport Options</SectionTitle>
        <div className="space-y-3">
          {route.transportOptions.map((opt, i) => (
            <div
              key={i}
              className={`flex flex-wrap items-center gap-4 p-4 rounded-sm border transition-all ${
                opt.recommended
                  ? 'bg-gold/10 border-gold/40'
                  : 'bg-white/[0.02] border-gold/10 hover:border-gold/25'
              }`}
            >
              <div className="font-body text-parchment text-base w-36">{opt.mode}</div>
              <div className="flex-1 min-w-[80px]">
                <div className="font-mono text-xs text-silver">Duration</div>
                <div className="font-body text-cream text-sm">{opt.duration}</div>
              </div>
              <div className="flex-1 min-w-[80px]">
                <div className="font-mono text-xs text-silver">Cost</div>
                <div className="font-body text-cream text-sm">{opt.cost}</div>
              </div>
              <div className="min-w-[80px]">
                <div className="font-mono text-xs text-silver mb-1">Comfort</div>
                <div className="flex gap-0.5">
                  {STARS.map(s => (
                    <span key={s} className={`text-sm ${s <= opt.comfort ? 'text-gold' : 'text-silver/30'}`}>★</span>
                  ))}
                </div>
              </div>
              {opt.recommended && (
                <span className="font-mono text-[10px] tracking-wider uppercase text-gold bg-gold/10 border border-gold/30 px-2 py-1 rounded-sm">
                  Recommended
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scenic note */}
      <div className="glass-card p-5 border-[#6abf6a]/30">
        <SectionTitle>🌿 Scenic Highlights</SectionTitle>
        <p className="text-cream text-base leading-relaxed">{route.scenicNote}</p>
      </div>

      {/* Map placeholder — Leaflet wired in next sprint */}
      <div className="glass-card p-5 flex flex-col items-center justify-center min-h-[200px] border-dashed border-gold/20">
        <div className="text-4xl mb-3 opacity-30">🗺</div>
        <p className="font-mono text-xs text-silver tracking-wider text-center">
          INTERACTIVE MAP — LEAFLET INTEGRATION COMING NEXT
        </p>
        <p className="font-body text-sm text-silver/50 mt-1">
          {route.from} → {route.to}
        </p>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="font-display text-gold font-bold text-base mb-4 border-l-2 border-gold pl-3">
      {children}
    </h3>
  )
}

function PanelTitle({ icon, agent, title }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-[#6abf6a] opacity-80">{agent}</div>
        <h2 className="font-display text-xl font-bold text-parchment">{title}</h2>
      </div>
    </div>
  )
}
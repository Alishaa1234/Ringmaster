// src/components/tabs/WeatherTab.jsx
export default function WeatherTab({ weather }) {
  return (
    <div className="animate-fade-up space-y-5">
      <PanelTitle icon="🌦" agent="Sky Gazer" title="Weather Forecast" />

      {/* Current conditions */}
      <div className="glass-card p-6 flex flex-wrap gap-6 items-center">
        <div className="text-center">
          <div className="text-6xl mb-1">☀️</div>
          <div className="font-display text-4xl font-bold gold-text">{weather.tempHigh}°C</div>
          <div className="font-mono text-xs text-silver mt-1">HIGH</div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="font-display text-xl font-bold text-parchment mb-1">{weather.condition}</div>
          <div className="font-mono text-sm text-silver">Humidity: {weather.humidity}%</div>
          <div className="font-mono text-sm text-silver">Night Low: {weather.tempLow}°C</div>
          <p className="text-cream text-base leading-relaxed mt-3">{weather.recommendation}</p>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="glass-card p-5">
        <SectionTitle>7-Day Outlook</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {weather.forecast.map((f, i) => (
            <div key={i} className="bg-white/[0.03] border border-gold/10 rounded-sm p-3 text-center hover:border-gold/30 transition-colors">
              <div className="font-mono text-[10px] text-silver tracking-wider mb-2">{f.day}</div>
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-display font-bold text-gold-light text-sm">{f.high}°</div>
              <div className="font-mono text-[10px] text-silver mt-1">{f.low}°</div>
              <div className="font-body text-[11px] text-silver/70 mt-1 italic">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Advisory */}
      <div className="glass-card p-5 border-[#4a9eda]/30">
        <SectionTitle>⚠ Sky Gazer's Advisory</SectionTitle>
        <p className="text-cream text-base leading-relaxed">{weather.alert}</p>
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
        <div className="font-mono text-[10px] tracking-widest uppercase text-[#4a9eda] opacity-80">{agent}</div>
        <h2 className="font-display text-xl font-bold text-parchment">{title}</h2>
      </div>
    </div>
  )
}
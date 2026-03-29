// src/components/tabs/ItineraryTab.jsx
import { useState } from 'react'

export default function ItineraryTab({ itinerary }) {
  const [expanded, setExpanded] = useState(0)

  return (
    <div className="animate-fade-up space-y-5">
      <PanelTitle icon="📅" agent="Orchestrator" title="The Grand Itinerary" />

      <div className="space-y-3">
        {itinerary.map((day, i) => (
          <div
            key={i}
            className={`glass-card overflow-hidden transition-all duration-300 ${
              expanded === i ? 'border-gold/50' : 'border-gold/15 hover:border-gold/30'
            }`}
          >
            {/* Day header — always visible */}
            <button
              className="w-full flex items-center gap-4 p-5 text-left"
              onClick={() => setExpanded(expanded === i ? -1 : i)}
            >
              <div className="font-display font-black text-3xl gold-text w-10 shrink-0 leading-none">
                {String(day.day).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <div className="font-mono text-[10px] text-silver tracking-widest uppercase mb-0.5">
                  Day {day.day}
                </div>
                <div className="font-display font-bold text-parchment text-base">{day.title}</div>
              </div>
              <div className={`text-gold transition-transform duration-300 ${expanded === i ? 'rotate-180' : ''}`}>
                ▾
              </div>
            </button>

            {/* Day detail — collapsible */}
            {expanded === i && (
              <div className="px-5 pb-5 space-y-3 border-t border-gold/10 pt-4">
                <TimeSlot icon="🌅" label="Morning"   text={day.morning}   />
                <TimeSlot icon="☀️"  label="Afternoon" text={day.afternoon} />
                <TimeSlot icon="🌙" label="Evening"   text={day.evening}   />
                {day.tip && (
                  <div className="flex gap-2 items-start mt-3 bg-gold/5 border border-gold/15 rounded-sm p-3">
                    <span className="text-gold text-sm mt-0.5">✦</span>
                    <p className="font-body italic text-silver text-sm leading-relaxed">{day.tip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Calendar sync placeholder */}
      <div className="glass-card p-4 border-dashed border-gold/20 flex items-center gap-3">
        <span className="text-xl opacity-40">📆</span>
        <p className="font-mono text-[10px] text-silver tracking-wider">
          GOOGLE CALENDAR SYNC — COMING IN INTERMEDIATE PHASE
        </p>
      </div>
    </div>
  )
}

function TimeSlot({ icon, label, text }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-base mt-0.5">{icon}</span>
      <div>
        <span className="font-mono text-[10px] text-gold tracking-wider uppercase">{label}: </span>
        <span className="font-body text-cream text-sm leading-relaxed">{text}</span>
      </div>
    </div>
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
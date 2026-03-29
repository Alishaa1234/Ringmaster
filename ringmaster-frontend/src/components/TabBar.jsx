// src/components/TabBar.jsx
const TABS = [
  { id: 'summary',   label: '✦ Summary'   },
  { id: 'weather',   label: '☁ Weather'   },
  { id: 'route',     label: '🗺 Route'     },
  { id: 'events',    label: '🎭 Events'    },
  { id: 'budget',    label: '💰 Budget'    },
  { id: 'itinerary', label: '📅 Itinerary' },
]

export default function TabBar({ active, onChange }) {
  return (
    <div className="flex border-b border-gold/20 overflow-x-auto">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-3 font-mono text-[11px] tracking-[0.12em] uppercase whitespace-nowrap transition-all duration-200 border-b-2 -mb-px ${
            active === tab.id ? 'tab-active' : 'tab-inactive'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
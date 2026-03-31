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
    <div className="border-b border-gold/20 overflow-x-auto scrollbar-none">
      <div className="flex min-w-max sm:min-w-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              px-3 sm:px-5 py-3 font-mono text-[10px] sm:text-[11px]
              tracking-[0.1em] uppercase whitespace-nowrap
              transition-all duration-200 border-b-2 -mb-px
              ${active === tab.id ? 'tab-active' : 'tab-inactive'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
// src/components/AgentCard.jsx
export default function AgentCard({ agent, status }) {
  const { name, title, icon, color, idleMsg } = agent
  const isThinking = status?.state === 'thinking'
  const isDone     = status?.state === 'done'

  return (
    <div
      className={`glass-card p-4 relative overflow-hidden transition-all duration-300 ${isThinking ? 'agent-glow' : ''}`}
      style={{ borderColor: isThinking || isDone ? color : 'rgba(200,146,42,0.25)' }}
    >
      {/* left accent bar */}
      <div
        className="absolute top-0 left-0 w-[3px] h-full transition-opacity duration-300"
        style={{ background: color, opacity: isThinking || isDone ? 1 : 0.4 }}
      />

      <div className="flex items-center gap-3 mb-2 pl-2">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="font-display font-bold text-sm" style={{ color }}>
            {name}
          </div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-silver">
            {title}
          </div>
        </div>
      </div>

      <p
        className={`font-mono text-xs pl-2 min-h-[1.2rem] transition-colors duration-300 ${
          isThinking ? 'text-gold-light' : isDone ? 'text-green-400' : 'text-silver'
        }`}
      >
        {status?.msg || idleMsg}
      </p>
    </div>
  )
}
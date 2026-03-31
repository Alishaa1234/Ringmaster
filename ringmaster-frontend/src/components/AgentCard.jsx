// src/components/AgentCard.jsx
export default function AgentCard({ agent, status }) {
  const { name, title, icon, color, idleMsg } = agent
  const isThinking = status?.state === 'thinking'
  const isDone     = status?.state === 'done'

  return (
    <div
      className={`glass-card p-3 sm:p-4 relative overflow-hidden transition-all duration-300 ${
        isThinking ? 'agent-glow' : ''
      }`}
      style={{
        borderColor: isThinking || isDone
          ? color
          : 'rgba(200,146,42,0.2)',
        borderLeftWidth: '3px',
        borderLeftColor: color,
      }}
    >
      {/* Thinking shimmer overlay */}
      {isThinking && (
        <div className="absolute inset-0 opacity-10 skeleton pointer-events-none" />
      )}

      {/* Done tick */}
      {isDone && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
          style={{ background: color, animation: 'tickIn 0.3s ease forwards' }}
        >
          ✓
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
        {/* Animated icon */}
        <span
          className="text-xl sm:text-2xl transition-transform duration-300"
          style={{ transform: isThinking ? 'scale(1.15)' : 'scale(1)' }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div
            className="font-display font-bold text-xs sm:text-sm truncate"
            style={{ color }}
          >
            {name}
          </div>
          <div className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-silver truncate">
            {title}
          </div>
        </div>
      </div>

      {/* Status line */}
      <div className="flex items-center gap-1.5 pl-0.5">
        {/* Blinking dot when thinking */}
        {isThinking && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background: color,
              animation: 'agentPulse 1s ease-in-out infinite',
            }}
          />
        )}
        <p
          className={`font-mono text-[10px] sm:text-[11px] transition-colors duration-300 truncate ${
            isThinking ? 'text-gold-light' : isDone ? 'text-green-400' : 'text-silver'
          }`}
        >
          {status?.msg || idleMsg}
        </p>
      </div>
    </div>
  )
}
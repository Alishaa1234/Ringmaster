// src/components/tabs/BudgetTab.jsx
export default function BudgetTab({ budget, duration }) {
  const tiers = ['low', 'mid', 'high']
  const tierLabels = { low: '🎒 Budget', mid: '🏨 Mid-Range', high: '✈ Luxury' }
  const tierColors = { low: 'text-green-400', mid: 'text-gold-light', high: 'text-[#c8922a]' }

  return (
    <div className="animate-fade-up space-y-5">
      <PanelTitle icon="💰" agent="Quartermaster" title="Budget Ledger" />

      {/* Total comparison */}
      <div className="grid grid-cols-3 gap-3">
        {tiers.map(tier => (
          <div key={tier} className="glass-card p-5 text-center">
            <div className="font-mono text-[10px] tracking-widest uppercase text-silver mb-2">
              {tierLabels[tier]}
            </div>
            <div className={`font-display font-bold text-2xl ${tierColors[tier]}`}>
              ₹{budget.totalEstimate[tier].toLocaleString()}
            </div>
            <div className="font-mono text-[10px] text-silver/60 mt-1">total / {duration} days</div>
          </div>
        ))}
      </div>

      {/* Breakdown table */}
      <div className="glass-card p-5">
        <SectionTitle>Cost Breakdown</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/20">
                <th className="font-mono text-[10px] tracking-wider uppercase text-silver text-left pb-3 pr-4">
                  Expense
                </th>
                {tiers.map(t => (
                  <th key={t} className={`font-mono text-[10px] tracking-wider uppercase pb-3 px-2 text-right ${tierColors[t]}`}>
                    {tierLabels[t].split(' ')[1]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {budget.breakdown.map((row, i) => (
                <tr key={i} className="border-b border-gold/[0.07] hover:bg-gold/[0.03] transition-colors">
                  <td className="font-body text-cream py-3 pr-4">{row.label}</td>
                  {tiers.map(t => (
                    <td key={t} className="font-mono text-right px-2 py-3 text-cream text-xs">
                      ₹{row[t].toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-gold/30">
                <td className="font-display font-bold text-gold-light py-3 pr-4">Total</td>
                {tiers.map(t => (
                  <td key={t} className={`font-display font-bold text-right px-2 py-3 ${tierColors[t]}`}>
                    ₹{budget.totalEstimate[t].toLocaleString()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Saving tip */}
      <div className="glass-card p-5 border-gold/30 flex gap-3 items-start">
        <span className="text-2xl">💡</span>
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-gold mb-2">
            Quartermaster's Saving Tip
          </p>
          <p className="text-cream text-base leading-relaxed">{budget.savingTip}</p>
        </div>
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
        <div className="font-mono text-[10px] tracking-widest uppercase text-gold opacity-70">{agent}</div>
        <h2 className="font-display text-xl font-bold text-parchment">{title}</h2>
      </div>
    </div>
  )
}
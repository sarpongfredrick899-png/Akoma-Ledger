import { useState } from 'react';
import { Transaction } from '../types';
import { TrendingUp, TrendingDown, Wallet, PieChart, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FinancialSummaryProps {
  transactions: Transaction[];
  overheadAdjustment: number;
  setOverheadAdjustment: (val: number) => void;
  totals: {
    revenue: number;
    directCosts: number;
    grossProfit: number;
    opEx: number;
    netProfit: number;
    whatIfAdjustment: number;
  };
}

export default function FinancialSummary({ transactions, overheadAdjustment, setOverheadAdjustment, totals }: FinancialSummaryProps) {
  const [showWork, setShowWork] = useState(false);
  const { revenue, directCosts, grossProfit, opEx, netProfit, whatIfAdjustment } = totals;

  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // Reminder Logic
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date === today);
  const todaySalesCount = todayTransactions.filter(t => t.type === 'income' || t.type === 'credit').length;
  const todayOpExCount = todayTransactions.filter(t => t.type === 'expense').length;
  const showOpExReminder = todaySalesCount >= 3 && todayOpExCount === 0;

  /**
   * Determines the color class based on the net margin percentage.
   */
  const getGaugeColor = (margin: number) => {
    if (margin < 10) return "text-rose-500";
    if (margin <= 25) return "text-amber-400";
    return "text-brand-gold";
  };

  /**
   * Returns a status label for the current business profitability level.
   */
  const getGaugeZone = (margin: number) => {
    if (margin < 10) return "Warning Zone";
    if (margin <= 25) return "Healthy Zone";
    return "Tycoon Level";
  };

  return (
    <div className="space-y-8">
      {showOpExReminder && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 luxury-glow"
        >
          <div className="p-2 rounded-full bg-amber-500/20 text-amber-500">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">High Volume Alert</p>
            <p className="text-sm text-white/70 italic font-display">Have you recorded your transport or electricity bills for today?</p>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Money Trail Header: Total Revenue */}
        <div className="p-10 glass-card luxury-glow border-white/5 relative overflow-hidden group hover:bg-white/[0.02] transition-all duration-700">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-24 h-24 text-white" />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-black mb-4">The Revenue Ceiling</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-2xl text-white/20 font-bold">GH₵</span>
                 <h2 className="text-6xl md:text-7xl font-black tracking-tighter text-blue-200/80 drop-shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
                    {revenue.toLocaleString()}
                 </h2>
              </div>
              <p className="text-xs text-white/20 mt-4 font-display italic font-light tracking-widest">Total gross intake before all frictions</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Section A: Direct Costs & Section B: Gross Profit */}
           <div className="p-8 glass-card luxury-glow border-emerald-500/10 space-y-6">
              <div className="flex justify-between items-center text-rose-400/60 uppercase tracking-widest text-[10px] font-bold">
                 <span>Section A: Direct Product Costs</span>
                 <span>- GH₵ {directCosts.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex justify-between items-end">
                <div>
                   <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Section B: Gross Profit</p>
                   <h3 className="text-3xl font-light text-emerald-400 luxury-text">
                      GH₵ {grossProfit.toLocaleString()}
                   </h3>
                </div>
                <div className="text-right">
                   <p className="text-[8px] text-white/10 uppercase font-black">Markup Retention</p>
                   <p className="text-xs text-white/30 font-mono">{(revenue > 0 ? (grossProfit / revenue) * 100 : 0).toFixed(1)}%</p>
                </div>
              </div>
           </div>

           {/* Section C: Manual Operational Expenses */}
           <div className="p-8 glass-card luxury-glow border-rose-500/10 space-y-6">
              <div className="flex justify-between items-center text-white/20 uppercase tracking-widest text-[10px] font-bold">
                 <span>Section C: Manual Expenses (OpEx)</span>
                 <Info className="w-3 h-3" />
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex justify-between items-end">
                <div>
                   <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Total Bills Recorded</p>
                   <h3 className="text-3xl font-light text-rose-400 luxury-text">
                      - GH₵ {opEx.toLocaleString()}
                   </h3>
                </div>
                <div className="text-right">
                   <p className="text-[8px] text-white/10 uppercase font-black italic">Operational Drag</p>
                   <p className="text-xs text-white/30 font-mono">GH₵ {opEx.toLocaleString()}</p>
                </div>
              </div>
           </div>
        </div>

        {/* Footer: Net Profit (The Final Money Trail Output) */}
        <div 
          onClick={() => setShowWork(!showWork)}
          className="p-10 glass-card luxury-glow border-brand-gold/30 bg-brand-gold/[0.02] cursor-pointer hover:bg-brand-gold/[0.05] transition-all group relative overflow-hidden"
        >
           <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent" />
           <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                 <p className="text-[10px] uppercase tracking-[0.6em] text-brand-gold font-black mb-2">Final Net Growth Capital</p>
                 <p className="text-sm text-white/40 italic font-display">"This is your actual business liquidity after all frictions."</p>
              </div>
              <div className="flex flex-col items-center md:items-end">
                 <div className="flex items-baseline gap-2">
                    <span className="text-2xl text-brand-gold/40 font-bold">GH₵</span>
                    <h2 className="text-6xl md:text-7xl font-bold tracking-tighter text-brand-gold luxury-text">
                       {netProfit.toLocaleString()}
                    </h2>
                    <ChevronDown className={cn("w-6 h-6 text-brand-gold/20 transition-transform mb-2", showWork && "rotate-180")} />
                 </div>
                 <div className="mt-2 flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full", netProfit >= 0 ? "bg-emerald-500" : "bg-rose-500")} />
                    <span className="text-[9px] uppercase tracking-widest font-bold text-white/20">Final Take Home Pay</span>
                 </div>
              </div>
           </div>

           {/* What-If Stress Test Slider */}
           <div className="mt-8 pt-8 border-t border-brand-gold/10" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.3em] text-brand-gold/40 italic">
                    <AlertCircle className="w-3 h-3" />
                    <span>"What-If" Stress Test: +{overheadAdjustment}% Buffer</span>
                 </div>
                 <span className="text-[10px] text-white/20 font-mono">Impact: -GH₵ {whatIfAdjustment.toLocaleString()}</span>
              </div>
              <input 
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={overheadAdjustment}
                onChange={(e) => setOverheadAdjustment(parseFloat(e.target.value))}
                className="w-full accent-brand-gold h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
              />
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showWork && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-8 glass-card border-brand-gold/20 luxury-glow">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-black">
                   <Info className="w-4 h-4" />
                </div>
                <h3 className="text-xs uppercase font-bold tracking-[0.4em] text-brand-gold">Profit Algorithm Breakdown</h3>
              </div>

              <div className="max-w-2xl space-y-4">
                <div className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Total Sales Flow</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-emerald-400 font-bold">+ GH₵ {revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Cost of Goods (Inventory)</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-rose-400 font-bold">- GH₵ {directCosts.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 rounded-xl bg-brand-gold/10 border border-brand-gold/20">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold">Gross Profit Margin</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-brand-gold font-bold">= GH₵ {grossProfit.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                   <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Manual Operational Costs</span>
                      <span className="text-[8px] text-white/20 italic">(Rent, Bills, Data, etc.)</span>
                   </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-rose-400 font-bold">- GH₵ {opEx.toLocaleString()}</span>
                  </div>
                </div>

                {overheadAdjustment > 0 && (
                  <div className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">"What-If" Simulation Adjustment</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-white/30 font-bold">- GH₵ {whatIfAdjustment.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold mb-1">Final Net Growth Capital</span>
                    <p className="text-[9px] text-white/20 italic">"This is your actual business liquidity after all frictions."</p>
                  </div>
                  <span className="text-3xl luxury-text text-brand-gold font-bold">
                    GH₵ {netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="glass-card p-10 luxury-glow flex flex-col md:flex-row items-center gap-12 overflow-hidden">
        <div className="relative w-48 h-48 shrink-0">
           {/* Gauge Background */}
           <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-white/5"
                strokeDasharray="188.5"
                strokeDashoffset="62.8" /* Shows 2/3 of a circle */
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className={getGaugeColor(netMargin)}
                strokeDasharray="188.5"
                strokeDashoffset={188.5 - (Math.min(100, Math.max(0, netMargin * 2)) / 100) * 125.7} 
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={cn("text-3xl font-mono font-bold tracking-tighter", getGaugeColor(netMargin))}>
                {netMargin.toFixed(1)}%
              </span>
              <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-white/20">Net Margin</span>
           </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-4 mb-6">
            <PieChart className={cn("w-8 h-8", getGaugeColor(netMargin))} />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/30">Profit Health Indicator</p>
              <h4 className={cn("text-2xl luxury-text uppercase tracking-widest", getGaugeColor(netMargin))}>
                {getGaugeZone(netMargin)}
              </h4>
            </div>
          </div>
          
          <p className="text-sm text-white/40 leading-relaxed font-light mb-6">
            Your enterprise maturity is currently indexed at <span className="text-white font-medium">{netMargin.toFixed(1)}%</span>. 
            {netMargin < 10 ? (
              " Your operational frictions are high. Re-evaluate your logistics or unit pricing to move into the healthy zone."
            ) : netMargin <= 25 ? (
              " You are maintaining a healthy operational flow. Small adjustments in overhead could push you toward Tycoon status."
            ) : (
              " Elite efficiency detected. You are generating capital at a rate typical of institutional-scale operations."
            )}
          </p>

          <div className="flex gap-3">
             <div className="px-3 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest">Warning &lt;10%</span>
             </div>
             <div className="px-3 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest">Healthy 11-25%</span>
             </div>
             <div className="px-3 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest">Tycoon &gt;25%</span>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}

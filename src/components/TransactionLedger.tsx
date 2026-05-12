import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, Trash2, Calendar, HandCoins } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionLedgerProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function TransactionLedger({ transactions, onDelete }: TransactionLedgerProps) {
  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center bg-brand-charcoal/30 border border-dashed border-white/10 rounded-3xl">
        <p className="text-white/20 italic font-light">No records found. Use the mic to capture your first transaction.</p>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowUpRight className="w-5 h-5" />;
      case 'expense': return <ArrowDownLeft className="w-5 h-5" />;
      case 'credit': return <HandCoins className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income': return "bg-emerald-500/5 border-emerald-500/20 text-emerald-400";
      case 'expense': return "bg-rose-500/5 border-rose-500/20 text-rose-400";
      case 'credit': return "bg-brand-gold/5 border-brand-gold/20 text-brand-gold";
      default: return "bg-white/5 border-white/10 text-white";
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income': return "text-emerald-400";
      case 'expense': return "text-rose-400";
      case 'credit': return "text-brand-gold";
      default: return "text-white";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
        <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Recent Ecosystem Activity</h4>
        <span className="text-[10px] font-medium text-white/10 uppercase tracking-widest">{transactions.length} Records</span>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {transactions.sort((a, b) => b.timestamp - a.timestamp).map((t) => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="group flex justify-between items-center py-5 px-6 hover:bg-white/[0.02] rounded-3xl transition-all border border-transparent hover:border-white/[0.05] luxury-glow"
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border",
                    getTransactionColor(t.type)
                )}>
                    {getTransactionIcon(t.type)}
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-medium text-base luxury-text flex items-center gap-2">
                        {t.description}
                        {t.type === 'credit' && (
                            <span className="text-[8px] bg-brand-gold/10 text-brand-gold px-1.5 py-0.5 rounded uppercase font-bold tracking-widest border border-brand-gold/20">Credit</span>
                        )}
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">{t.category}</span>
                    <span className="text-[9px] text-white/10 italic">{t.date}</span>
                    </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right flex flex-col">
                  <span className={cn(
                    "font-mono font-bold text-base tracking-tighter",
                    getAmountColor(t.type)
                  )}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '⇌'} GH₵ {(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </span>
                  <div className="flex flex-col items-end gap-1 mt-1">
                    {t.grossProfit !== undefined && (
                        <span className="text-[9px] text-white/10 uppercase font-bold tracking-[0.1em]">
                          Gross: GH₵ {(t.grossProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                    )}
                    {(t.type === 'income' || t.type === 'credit') && t.netProfit !== undefined && (
                        <span className="text-[9px] text-brand-gold/60 uppercase font-bold tracking-[0.1em] italic">
                          Net Yield: GH₵ {(t.netProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => onDelete(t.id)}
                  className="w-10 h-10 flex items-center justify-center text-white/5 hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-xl opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

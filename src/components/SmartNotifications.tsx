import { Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, TrendingUp, Package } from 'lucide-react';

interface SmartNotificationsProps {
  transactions: Transaction[];
}

export default function SmartNotifications({ transactions }: SmartNotificationsProps) {
  // Logic: If a product appears more than 3 times in the daily log with a profit margin over 20%
  // We'll look at the last week of transactions for context
  
  const productStats = transactions
    .filter(t => t.type === 'income' && t.product)
    .reduce((acc, t) => {
      const name = t.product!;
      if (!acc[name]) {
        acc[name] = { count: 0, totalRevenue: 0, totalGrossProfit: 0 };
      }
      acc[name].count += 1;
      acc[name].totalRevenue += t.amount;
      acc[name].totalGrossProfit += (t.grossProfit || 0);
      return acc;
    }, {} as Record<string, { count: number; totalRevenue: number; totalGrossProfit: number }>);

  const suggestions = Object.entries(productStats)
    .filter(([_, stats]) => {
      const margin = stats.totalRevenue > 0 ? (stats.totalGrossProfit / stats.totalRevenue) : 0;
      return stats.count >= 3 && margin > 0.3;
    })
    .map(([name]) => name);

  if (suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="space-y-4">
        {suggestions.map((product) => (
          <motion.div
            key={product}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 glass-panel border-l-4 border-l-brand-gold bg-gradient-to-r from-brand-gold/10 via-brand-charcoal to-transparent flex items-start gap-6 luxury-glow"
          >
            <div className="w-14 h-14 bg-brand-gold text-black rounded-2xl shadow-xl flex items-center justify-center shrink-0">
              <Package className="w-7 h-7" />
            </div>
            
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold">🚀 AI Growth Strategy</span>
                </div>
                <p className="text-xl font-light luxury-text leading-tight text-white mb-2">
                    <span className="gold-text-gradient font-bold capitalize italic">{product}</span> is your most profitable asset.
                </p>
                <p className="text-sm text-white/40 leading-relaxed max-w-lg">
                    With a profit margin exceeding 30%, we suggest prioritizing <span className="text-brand-gold">{product}</span> for your next inventory restock to maximize capital yield this cycle.
                </p>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

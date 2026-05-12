import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProfitChartProps {
  transactions: Transaction[];
}

export default function ProfitChart({ transactions }: ProfitChartProps) {
  const data = transactions
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-10)
    .map(t => ({
      name: t.date,
      amount: t.netProfit,
      type: t.type,
      originalName: t.description
    }));

  if (data.length === 0) return null;

  return (
    <div className="h-[200px] w-full bg-transparent p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Analytics</h3>
        <span className="text-[10px] uppercase font-bold text-brand-amber">Trending</span>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8 }}
          />
          <YAxis 
            hide
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(2, 44, 34, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
            itemStyle={{ color: '#f59e0b', fontSize: '10px' }}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Bar dataKey="amount" radius={[4, 4, 4, 4]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.amount >= 0 ? '#10b981' : '#f43f5e'} 
                fillOpacity={0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

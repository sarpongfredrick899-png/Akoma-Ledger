import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ProductProgressChartProps {
  transactions: Transaction[];
}

export default function ProductProgressChart({ transactions }: ProductProgressChartProps) {
  // Aggregate revenue by product
  const productData = transactions
    .filter(t => t.type === 'income' && t.product)
    .reduce((acc, t) => {
      const name = t.product || 'Unknown';
      if (!acc[name]) {
        acc[name] = { name, revenue: 0 };
      }
      acc[name].revenue += t.amount;
      return acc;
    }, {} as Record<string, { name: string; revenue: number }>);

  const data = Object.values(productData)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  if (data.length === 0) return null;

  return (
    <div className="glass-panel p-10 luxury-glow">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold mb-1">Portfolio Analysis</h3>
          <p className="text-2xl luxury-text">Product Performance</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-full">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">Market Velocity</span>
        </div>
      </div>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40 }}>
            <CartesianGrid strokeDasharray="10 10" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.02)" />
            <XAxis 
              type="number"
              hide={true}
            />
            <YAxis 
              dataKey="name" 
              type="category"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 'medium', fontFamily: 'Space Grotesk' }}
              width={100}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.95)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '16px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#D4AF37', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            />
            <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={24}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#D4AF37' : '#D4AF37'} fillOpacity={1 - (index * 0.15)} />
              ))}
              <LabelList 
                dataKey="revenue" 
                position="right" 
                style={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', fontFamily: 'Lexend' }} 
                formatter={(val: number) => `GH₵ ${val.toLocaleString()}`} 
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

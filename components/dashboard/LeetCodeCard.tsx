import React, { useMemo } from 'react';
import { Code2, Flame } from 'lucide-react';
import { Card } from '../ui/Card';

export const LeetCodeCard: React.FC = () => {
  // Generate consistent mock data for the heatmap (31 days)
  // We use useMemo to prevent the random values from changing on every render
  const contributions = useMemo(() => {
    return Array.from({ length: 31 }, () => {
      const rand = Math.random();
      if (rand > 0.75) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'; // High Activity
      if (rand > 0.4) return 'bg-emerald-900/60'; // Low Activity
      return 'bg-zinc-800/50'; // No Activity
    });
  }, []);

  return (
    <Card title="LeetCode" icon={Code2} className="col-span-1">
      <div className="flex flex-col justify-between h-full">
        <div className="flex items-end justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-white leading-none">12</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Day Streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Flame size={12} className="fill-emerald-500 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-400">Top 5%</span>
          </div>
        </div>
        
        {/* Monthly Heatmap Grid */}
        <div className="grid grid-cols-7 gap-2 place-content-center">
          {contributions.map((colorClass, i) => (
            <div 
              key={i} 
              className={`h-3 w-3 rounded-[2px] ${colorClass} transition-all duration-300 hover:scale-125`}
              title={`Day ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};
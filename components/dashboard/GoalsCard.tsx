import React from 'react';
import { Target, Check, Pencil } from 'lucide-react';
import { Card } from '../ui/Card';

export interface Goal {
  id: number;
  text: string;
  completed: boolean;
}

interface GoalsCardProps {
  goals: Goal[];
  onToggle: (id: number) => void;
  onEdit: () => void;
}

export const GoalsCard: React.FC<GoalsCardProps> = ({ goals, onToggle, onEdit }) => {
  return (
    <Card 
      title="Objectives" 
      icon={Target} 
      className="col-span-1 md:col-span-2"
      action={
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 hover:bg-[#262626] rounded text-gray-600 hover:text-white transition-colors group"
          title="Edit Objectives"
        >
          <Pencil size={14} className="group-hover:scale-110 transition-transform" />
        </button>
      }
    >
      <div className="flex flex-col justify-center h-full gap-3">
        {goals.map((goal) => (
          <div 
            key={goal.id}
            onClick={() => onToggle(goal.id)}
            className={`
              group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 select-none
              ${goal.completed 
                ? 'bg-emerald-900/10 border-emerald-900/30' 
                : 'bg-[#0a0a0a] border-[#262626] hover:border-gray-600'
              }
            `}
          >
            {/* Custom Checkbox */}
            <div className={`
              w-5 h-5 rounded flex items-center justify-center border transition-colors duration-200
              ${goal.completed
                ? 'bg-emerald-500 border-emerald-500'
                : 'bg-[#161616] border-gray-600 group-hover:border-gray-400'
              }
            `}>
              {goal.completed && <Check size={12} className="text-black stroke-[3px]" />}
            </div>

            <span className={`
              text-sm font-medium transition-colors duration-200
              ${goal.completed ? 'text-gray-500 line-through' : 'text-gray-200'}
            `}>
              {goal.text}
            </span>
          </div>
        ))}
        {goals.length === 0 && (
           <div className="text-center text-xs text-gray-600 py-4 italic">
              No active objectives set.
           </div>
        )}
      </div>
    </Card>
  );
};
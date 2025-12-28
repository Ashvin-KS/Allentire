import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Calendar, CheckSquare, X, Code2 } from 'lucide-react';
import { Goal } from './GoalsCard';

interface TaskAlerterProps {
  isOpen: boolean;
  onClose: () => void;
  pendingGoals: Goal[];
  onMigrate: (goalIds: number[]) => void;
}

export const TaskAlerter: React.FC<TaskAlerterProps> = ({ isOpen, onClose, pendingGoals, onMigrate }) => {
  const [selectedForMigration, setSelectedForMigration] = useState<number[]>(
    pendingGoals.map(g => g.id)
  );

  // Mock LeetCode Status (In a real app, this would come from props/store)
  const isLeetCodeDone = false; 

  if (!isOpen) return null;

  const toggleSelection = (id: number) => {
    if (selectedForMigration.includes(id)) {
      setSelectedForMigration(selectedForMigration.filter(i => i !== id));
    } else {
      setSelectedForMigration([...selectedForMigration, id]);
    }
  };

  const handleMigrateAction = () => {
    onMigrate(selectedForMigration);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#161616] border border-amber-500/30 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.15)] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertTriangle size={20} className="text-amber-500" />
            </div>
            <div>
                <h2 className="text-white font-bold text-lg leading-none">System Alert</h2>
                <span className="text-xs text-amber-500/80 font-mono uppercase tracking-wider">Pending Items Detected</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
            
            {/* LeetCode Warning */}
            {!isLeetCodeDone && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-red-500/20">
                    <Code2 size={18} className="text-red-400 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-red-200">Daily LeetCode Incomplete</h3>
                        <p className="text-xs text-gray-500 mt-1">Streak at risk. Recommended action: Complete immediately or freeze streak.</p>
                    </div>
                </div>
            )}

            {/* Pending Goals List */}
            <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <CheckSquare size={14} /> Unfinished Objectives
                </h3>
                <div className="flex flex-col gap-2">
                    {pendingGoals.length === 0 ? (
                        <span className="text-xs text-emerald-500 italic">All objectives completed. Good work.</span>
                    ) : (
                        pendingGoals.map(goal => (
                            <div 
                                key={goal.id}
                                onClick={() => toggleSelection(goal.id)}
                                className={`
                                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                    ${selectedForMigration.includes(goal.id) 
                                        ? 'bg-amber-500/10 border-amber-500/40' 
                                        : 'bg-[#0a0a0a] border-[#262626] opacity-60'}
                                `}
                            >
                                <div className={`
                                    w-4 h-4 rounded border flex items-center justify-center
                                    ${selectedForMigration.includes(goal.id) 
                                        ? 'border-amber-500 bg-amber-500' 
                                        : 'border-gray-600'}
                                `}>
                                    {selectedForMigration.includes(goal.id) && <ArrowRight size={10} className="text-black" />}
                                </div>
                                <span className="text-sm text-gray-200">{goal.text}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="flex gap-3 mt-2">
                <button 
                    onClick={handleMigrateAction}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-amber-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Calendar size={14} />
                    Move to Tomorrow
                </button>
                 <button 
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#262626] transition-all"
                >
                    Dismiss
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

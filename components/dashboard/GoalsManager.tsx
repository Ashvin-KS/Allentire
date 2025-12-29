import React, { useState } from 'react';
import { ArrowLeft, Trash2, Plus, Target } from 'lucide-react';
import { Goal } from './GoalsCard';

interface GoalsManagerProps {
  goals: Goal[];
  onAdd: (text: string) => void;
  onDelete: (id: number) => void;
  onBack: () => void;
}

export const GoalsManager: React.FC<GoalsManagerProps> = ({ goals, onAdd, onDelete, onBack }) => {
  const [newGoal, setNewGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.trim()) {
      onAdd(newGoal.trim());
      setNewGoal('');
    }
  };

  return (
    <div className="h-full w-full flex flex-col animate-in fade-in zoom-in duration-300 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-[#161616] rounded-lg text-gray-400 hover:text-white transition-colors border border-transparent hover:border-[#333]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="text-emerald-500" />
            Objectives Protocol
          </h1>
          <p className="text-gray-500 text-sm">Manage your daily targets and priorities.</p>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
        {/* Add Goal */}
        <form onSubmit={handleSubmit} className="mb-8">
            <div className="relative group">
                <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Enter new objective..."
                    className="w-full bg-transparent border-b border-[#333] py-4 pl-2 pr-12 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                />
                <button 
                    type="submit"
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-emerald-500 hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                    disabled={!newGoal.trim()}
                >
                    <Plus size={24} />
                </button>
            </div>
        </form>

        {/* Goals List */}
        <div className="flex flex-col gap-3">
            {goals.length === 0 && (
                <div className="text-center text-gray-600 py-10 italic border border-dashed border-[#262626] rounded-xl">
                    No active objectives. Add one above.
                </div>
            )}
            {goals.map(goal => (
                <div key={goal.id} className="group flex items-center justify-between p-4 bg-[#161616] border border-[#262626] rounded-xl hover:border-gray-600 transition-all shadow-sm">
                    <span className={`text-base font-medium ${goal.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                        {goal.text}
                    </span>
                    <button 
                        onClick={() => onDelete(goal.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Objective"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { LeetCodeCard } from '../components/dashboard/LeetCodeCard';
import { FitnessCard } from '../components/dashboard/FitnessCard';
import { GoalsCard, Goal } from '../components/dashboard/GoalsCard';
import { NewsCard } from '../components/dashboard/NewsCard';
import { ProjectsCard } from '../components/dashboard/ProjectsCard';
import { GraduationCap, HardDrive, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { GoalsManager } from '../components/dashboard/GoalsManager';
import { NewsManager } from '../components/dashboard/NewsManager';
import { TaskAlerter } from '../components/dashboard/TaskAlerter';

type ViewMode = 'grid' | 'goals' | 'news';

export const DashboardView: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAlerter, setShowAlerter] = useState(false);

  // Lifted Goals State
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, text: "Solve 2 Hard Problems", completed: false },
    { id: 2, text: "Read System Design Ch.4", completed: true },
    { id: 3, text: "Submit Lab Assignment", completed: false },
  ]);

  const toggleGoal = (id: number) => {
    setGoals(goals.map(g => 
      g.id === id ? { ...g, completed: !g.completed } : g
    ));
  };

  const addGoal = (text: string) => {
    const newId = Math.max(0, ...goals.map(g => g.id)) + 1;
    setGoals([...goals, { id: newId, text, completed: false }]);
  };

  const deleteGoal = (id: number) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  // Handle migration (simulating moving to next day by removing from today)
  const handleMigrate = (goalIds: number[]) => {
    setGoals(goals.filter(g => !goalIds.includes(g.id)));
    // In a real app, you would add these to a 'tomorrow' store or date-based DB
  };

  // --- View Render Logic ---

  if (viewMode === 'goals') {
    return (
      <GoalsManager 
        goals={goals} 
        onAdd={addGoal} 
        onDelete={deleteGoal} 
        onBack={() => setViewMode('grid')} 
      />
    );
  }

  if (viewMode === 'news') {
    return (
      <NewsManager onBack={() => setViewMode('grid')} />
    );
  }

  // Default Grid View
  return (
    <div className="flex flex-col h-full">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between px-4 md:px-8 pt-2 pb-6">
        <div>
           <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
           <p className="text-xs text-gray-500">System Nominal. Welcome back.</p>
        </div>
        <button 
          onClick={() => setShowAlerter(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161616] border border-[#262626] text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-xs font-bold uppercase tracking-wider shadow-sm"
        >
          <AlertTriangle size={14} />
          System Check
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4 md:px-8 pb-8 animate-in fade-in zoom-in duration-500">
        
        {/* --- TOP ROW --- */}
        
        {/* 1. LeetCode Card (1 col) */}
        <LeetCodeCard />

        {/* 2. Fitness Card (1 col) */}
        <FitnessCard />

        {/* 3. Daily Focus / Goals (2 cols) */}
        <GoalsCard 
          goals={goals} 
          onToggle={toggleGoal} 
          onEdit={() => setViewMode('goals')}
        />


        {/* --- MIDDLE ROW --- */}

        {/* 4. Smart Briefing / News (2 cols) */}
        <NewsCard onEdit={() => setViewMode('news')} />

        {/* 5. School Tracker (1 col) */}
        <Card title="Assignments" icon={GraduationCap} className="col-span-1">
          <div className="flex flex-col justify-center h-full">
            {/* Only showing the high priority assignment to fit 1 col */}
            <div className="flex flex-col p-4 bg-[#0a0a0a] rounded-lg border border-[#262626] group hover:border-red-500/30 transition-colors gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Urgent</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-200 leading-tight">Algorithms & Data Structures</span>
                <span className="text-xs text-gray-500 mt-1">Due Tomorrow, 11:59 PM</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 6. Desktop Cleaner (1 col) */}
        <Card title="Cleaner" icon={HardDrive} className="col-span-1">
          <div 
            className="h-full border-2 border-dashed border-[#333] rounded-lg flex flex-col items-center justify-center p-2 transition-colors hover:border-gray-500 hover:bg-[#262626]/30 cursor-pointer group text-center"
          >
              <div className="p-2 bg-[#262626] rounded-full mb-2 group-hover:scale-110 transition-transform shadow-lg">
                  <HardDrive size={18} className="text-gray-400 group-hover:text-white" />
              </div>
              <p className="text-xs font-medium text-gray-300">Drag Files</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Auto-sort</p>
          </div>
        </Card>


        {/* --- BOTTOM ROW --- */}

        {/* 7. Email Gatekeeper (2 cols) */}
        <Card title="Gatekeeper" icon={Mail} className="col-span-1 md:col-span-2">
          <div className="flex flex-col items-center justify-center h-full py-2">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
              <CheckCircle size={24} className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>
            <h2 className="text-lg font-bold text-white mb-0.5">Inbox Zero</h2>
            <p className="text-xs text-gray-500">You are all caught up.</p>
          </div>
        </Card>

        {/* 8. Projects Hub (2 cols) */}
        <ProjectsCard />
      </div>

      {/* Task Alerter Modal */}
      <TaskAlerter 
        isOpen={showAlerter} 
        onClose={() => setShowAlerter(false)} 
        pendingGoals={goals.filter(g => !g.completed)}
        onMigrate={handleMigrate}
      />
    </div>
  );
};

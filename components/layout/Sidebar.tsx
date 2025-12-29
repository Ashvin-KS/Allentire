import React from 'react';
import { LayoutGrid, Code2, Brain, CalendarClock, Headphones } from 'lucide-react';
import { useNavStore, Tab } from '../../store/useNavStore';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useNavStore();

  const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { id: 'code', icon: Code2, label: 'Code' },
    { id: 'brain', icon: Brain, label: 'Brain' },
    { id: 'schedule', icon: CalendarClock, label: 'Schedule' },
    { id: 'zen', icon: Headphones, label: 'Zen Mode' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-[#161616] border-r border-[#262626] flex flex-col items-center py-6 z-50">
      <div className="flex flex-col gap-8">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
                ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
              `}
              aria-label={item.label}
            >
              {/* Active Glow Effect */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-cyan-500/20 blur-md" />
              )}

              <Icon
                size={24}
                className={`
                  relative z-10 transition-all duration-300
                  ${isActive ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}
                `}
              />

              {/* Tooltip on hover (optional enhancement for UX) */}
              <div className="absolute left-14 px-2 py-1 bg-[#262626] border border-[#333] text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
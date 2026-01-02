import React, { useState, useEffect, useMemo } from 'react';
import { Code2, Flame, ChevronLeft, ChevronRight, X, Calendar, TrendingUp, History } from 'lucide-react';
import { Card } from '../ui/Card';
import { useLeetCodeActivityStore, DailyActivity } from '../../store/useLeetCodeActivityStore';
import { useCodeStore } from '../../store/useCodeStore';
import { motion, AnimatePresence } from 'framer-motion';

// Month names for display
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to get activity level class based on count
const getActivityClass = (count: number): string => {
    if (count === 0) return 'bg-zinc-800/50 border border-zinc-700/30';
    if (count === 1) return 'bg-emerald-700/40 border border-emerald-600/30'; // Light green - 1 problem
    if (count === 2) return 'bg-emerald-600/60 border border-emerald-500/40'; // Medium green - 2 problems
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-emerald-400/50'; // Bright green - 3+ problems
};

// Get month key from Date
const getMonthKey = (date: Date = new Date()): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Day Cell with Tooltip Component
interface DayCellProps {
    day: DailyActivity;
    problemTitles: Record<string, string>;
    size?: 'sm' | 'md';
}

const DayCell: React.FC<DayCellProps> = ({ day, problemTitles, size = 'md' }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-5 w-5';

    // Get problem names for this day
    const solvedProblems = day.problemIds.map(id => problemTitles[id] || `Problem #${id.slice(-6)}`);

    // Format date nicely
    const dateObj = new Date(day.date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    return (
        <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div
                className={`${sizeClass} rounded-sm ${getActivityClass(day.count)} transition-all duration-300 hover:scale-125 cursor-pointer`}
            />

            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none"
                    >
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 shadow-xl min-w-[180px] max-w-[250px]">
                            {/* Date Header */}
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#333]">
                                <span className="text-xs font-bold text-white">{formattedDate}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${day.count === 0 ? 'bg-zinc-700/50 text-zinc-400' :
                                        day.count >= 3 ? 'bg-emerald-500/20 text-emerald-400' :
                                            'bg-emerald-700/30 text-emerald-300'
                                    }`}>
                                    {day.count} solved
                                </span>
                            </div>

                            {/* Problem List */}
                            {day.count === 0 ? (
                                <p className="text-[11px] text-gray-500 italic">No problems solved</p>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    {solvedProblems.map((title, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                            <span className="text-[11px] text-gray-300 leading-tight">{title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tooltip Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#333]" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// History Modal Component
interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
    const { getAllMonthKeys, getMonthData, history, currentActivity, currentMonthKey } = useLeetCodeActivityStore();
    const { problems } = useCodeStore();

    // Create a map of problem ID to title
    const problemTitles = useMemo(() => {
        const map: Record<string, string> = {};
        problems.forEach(p => { map[p.id] = p.title; });
        return map;
    }, [problems]);

    // Get all available months including current
    const allMonthKeys = useMemo(() => {
        const historyKeys = getAllMonthKeys();
        if (!historyKeys.includes(currentMonthKey)) {
            return [currentMonthKey, ...historyKeys];
        }
        return [currentMonthKey, ...historyKeys.filter(k => k !== currentMonthKey)];
    }, [getAllMonthKeys, currentMonthKey]);

    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

    useEffect(() => {
        if (isOpen) {
            setSelectedMonth(currentMonthKey);
        }
    }, [isOpen, currentMonthKey]);

    const isCurrentMonth = selectedMonth === currentMonthKey;

    const { monthDays, monthStats } = useMemo(() => {
        const parts = selectedMonth.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days: DailyActivity[] = [];

        const dataSource = isCurrentMonth ? currentActivity : (getMonthData(selectedMonth)?.days || {});

        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const activity = dataSource[dateKey];
            days.push(activity || { date: dateKey, count: 0, problemIds: [] });
        }

        const totalSolved = days.reduce((sum, day) => sum + day.count, 0);

        let maxStreak = 0;
        let tempStreak = 0;
        for (const day of days) {
            if (day.count > 0) {
                tempStreak++;
                maxStreak = Math.max(maxStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        return {
            monthDays: days,
            monthStats: {
                totalSolved,
                streak: maxStreak,
                year,
                month
            }
        };
    }, [selectedMonth, isCurrentMonth, currentActivity, getMonthData]);

    const currentMonthIndex = allMonthKeys.indexOf(selectedMonth);

    const handlePrevMonth = () => {
        if (currentMonthIndex < allMonthKeys.length - 1) {
            setSelectedMonth(allMonthKeys[currentMonthIndex + 1]);
        }
    };

    const handleNextMonth = () => {
        if (currentMonthIndex > 0) {
            setSelectedMonth(allMonthKeys[currentMonthIndex - 1]);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-lg p-6 shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Calendar size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">LeetCode Progress</h2>
                                <p className="text-xs text-gray-500">Hover over days to see solved problems</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[#262626] rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={handlePrevMonth}
                            disabled={currentMonthIndex >= allMonthKeys.length - 1}
                            className="p-2 hover:bg-[#262626] rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="text-center">
                            <h3 className="text-white font-bold flex items-center gap-2 justify-center">
                                {MONTH_NAMES[monthStats.month]} {monthStats.year}
                                {isCurrentMonth && (
                                    <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                                        CURRENT
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center justify-center gap-4 mt-1">
                                <span className="text-emerald-400 text-xs font-medium">
                                    {monthStats.totalSolved} solved
                                </span>
                                <span className="text-orange-400 text-xs font-medium flex items-center gap-1">
                                    <Flame size={10} /> {monthStats.streak} best streak
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleNextMonth}
                            disabled={currentMonthIndex <= 0}
                            className="p-2 hover:bg-[#262626] rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="text-[9px] text-gray-600 text-center font-medium">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {/* Empty cells for alignment */}
                            {(() => {
                                const firstDay = new Date(monthStats.year, monthStats.month, 1).getDay();
                                return Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="h-5 w-5" />
                                ));
                            })()}

                            {monthDays.map((day, i) => (
                                <DayCell
                                    key={i}
                                    day={day}
                                    problemTitles={problemTitles}
                                    size="md"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-500">
                        <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-sm bg-zinc-800/50 border border-zinc-700/30" />
                            <span>None</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-sm bg-emerald-700/40 border border-emerald-600/30" />
                            <span>1</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-sm bg-emerald-600/60 border border-emerald-500/40" />
                            <span>2</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-sm bg-emerald-500 border border-emerald-400/50" />
                            <span>3+</span>
                        </div>
                    </div>

                    {/* Quick Navigation */}
                    {allMonthKeys.length > 1 && (
                        <div className="mt-6 pt-4 border-t border-[#222]">
                            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3 text-center">Quick Navigation</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {allMonthKeys.slice(0, 6).map((key) => {
                                    const parts = key.split('-');
                                    const monthName = MONTH_NAMES[parseInt(parts[1]) - 1].slice(0, 3);
                                    const isSelected = key === selectedMonth;
                                    const isCurrent = key === currentMonthKey;

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedMonth(key)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSelected
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-[#1a1a1a] text-gray-500 hover:text-gray-300 border border-[#333]'
                                                }`}
                                        >
                                            {monthName} '{parts[0].slice(2)}
                                            {isCurrent && ' •'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export const LeetCodeCard: React.FC = () => {
    const {
        currentStreak,
        getCurrentMonthDays,
        checkAndRotateMonth,
        currentActivity
    } = useLeetCodeActivityStore();

    const { problems } = useCodeStore();

    const [showHistory, setShowHistory] = useState(false);

    // Create a map of problem ID to title
    const problemTitles = useMemo(() => {
        const map: Record<string, string> = {};
        problems.forEach(p => { map[p.id] = p.title; });
        return map;
    }, [problems]);

    useEffect(() => {
        checkAndRotateMonth();
        const interval = setInterval(() => {
            checkAndRotateMonth();
        }, 60000);
        return () => clearInterval(interval);
    }, [checkAndRotateMonth]);

    // Get current month's activity data as DailyActivity objects
    const contributions = useMemo(() => {
        return getCurrentMonthDays();
    }, [getCurrentMonthDays, currentActivity]);

    const monthlyTotal = useMemo(() => {
        return contributions.reduce((sum, day) => sum + day.count, 0);
    }, [contributions]);

    const currentMonthName = useMemo(() => {
        const now = new Date();
        return MONTH_NAMES[now.getMonth()];
    }, []);

    return (
        <>
            <Card title="LeetCode" icon={Code2} className="col-span-1">
                <div className="flex flex-col justify-between h-full">
                    <div className="flex items-end justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-3xl font-bold text-white leading-none">{currentStreak}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Day Streak</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <TrendingUp size={12} className="text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-400">{monthlyTotal} this month</span>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Heatmap Grid */}
                    <div className="flex flex-col gap-2">
                        <div
                            className="flex items-center justify-between cursor-pointer group"
                            onClick={() => setShowHistory(true)}
                        >
                            <span className="text-[9px] text-gray-600 uppercase tracking-wider font-medium">
                                {currentMonthName}
                            </span>
                            <span className="text-[9px] text-gray-600 group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                                <History size={10} />
                                View Details
                            </span>
                        </div>
                        <div className="grid grid-cols-7 gap-2 place-content-center">
                            {contributions.map((day, i) => (
                                <DayCell
                                    key={i}
                                    day={day}
                                    problemTitles={problemTitles}
                                    size="sm"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* History Modal */}
            <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />
        </>
    );
};

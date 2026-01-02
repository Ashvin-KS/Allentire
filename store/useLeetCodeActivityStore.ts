import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DailyActivity {
    date: string; // YYYY-MM-DD format
    count: number; // Number of problems solved
    problemIds: string[]; // IDs of problems solved
}

export interface MonthlyRecord {
    monthKey: string; // YYYY-MM format
    year: number;
    month: number; // 0-11
    days: Record<string, DailyActivity>; // keyed by date string
    totalSolved: number;
    streak: number; // Max streak in that month
}

interface LeetCodeActivityState {
    // Current month data
    currentMonthKey: string;
    currentActivity: Record<string, DailyActivity>; // keyed by date

    // Historical data - keyed by YYYY-MM
    history: Record<string, MonthlyRecord>;

    // Streak tracking
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;

    // Actions
    recordSolve: (problemId: string) => void;
    unrecordSolve: (problemId: string) => void;
    checkAndRotateMonth: () => void;
    getDayActivity: (date: string) => DailyActivity | null;
    getCurrentMonthDays: () => DailyActivity[];
    getMonthData: (monthKey: string) => MonthlyRecord | null;
    getAllMonthKeys: () => string[];
}

// Helper functions
const getMonthKey = (date: Date = new Date()): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getDateKey = (date: Date = new Date()): string => {
    return date.toISOString().split('T')[0];
};

const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

const calculateStreak = (activities: Record<string, DailyActivity>, today: string): number => {
    let streak = 0;
    const currentDate = new Date(today);

    while (true) {
        const dateKey = getDateKey(currentDate);
        const activity = activities[dateKey];

        if (activity && activity.count > 0) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (streak === 0) {
            // Check yesterday if today hasn't been started yet
            currentDate.setDate(currentDate.getDate() - 1);
            const yesterdayActivity = activities[getDateKey(currentDate)];
            if (yesterdayActivity && yesterdayActivity.count > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    return streak;
};

export const useLeetCodeActivityStore = create<LeetCodeActivityState>()(
    persist(
        (set, get) => ({
            currentMonthKey: getMonthKey(),
            currentActivity: {},
            history: {},
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,

            checkAndRotateMonth: () => {
                const state = get();
                const newMonthKey = getMonthKey();

                if (state.currentMonthKey !== newMonthKey) {
                    // Archive the current month before rotating
                    const oldMonthParts = state.currentMonthKey.split('-');
                    const year = parseInt(oldMonthParts[0]);
                    const month = parseInt(oldMonthParts[1]) - 1;

                    const totalSolved = Object.values(state.currentActivity).reduce(
                        (sum, day) => sum + day.count, 0
                    );

                    // Calculate max streak for the month
                    let maxStreak = 0;
                    let tempStreak = 0;
                    const daysInMonth = getDaysInMonth(year, month);

                    for (let d = 1; d <= daysInMonth; d++) {
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        if (state.currentActivity[dateKey]?.count > 0) {
                            tempStreak++;
                            maxStreak = Math.max(maxStreak, tempStreak);
                        } else {
                            tempStreak = 0;
                        }
                    }

                    const archivedMonth: MonthlyRecord = {
                        monthKey: state.currentMonthKey,
                        year,
                        month,
                        days: { ...state.currentActivity },
                        totalSolved,
                        streak: maxStreak
                    };

                    set({
                        currentMonthKey: newMonthKey,
                        currentActivity: {},
                        history: {
                            ...state.history,
                            [state.currentMonthKey]: archivedMonth
                        }
                    });
                }
            },

            recordSolve: (problemId: string) => {
                const state = get();

                // First ensure we're in the right month
                state.checkAndRotateMonth();

                const today = getDateKey();
                const currentState = get(); // Get fresh state after potential rotation

                const existingActivity = currentState.currentActivity[today] || {
                    date: today,
                    count: 0,
                    problemIds: []
                };

                // Check if problem already recorded today
                if (existingActivity.problemIds.includes(problemId)) {
                    return; // Already recorded
                }

                const updatedActivity: DailyActivity = {
                    ...existingActivity,
                    count: existingActivity.count + 1,
                    problemIds: [...existingActivity.problemIds, problemId]
                };

                const newCurrentActivity = {
                    ...currentState.currentActivity,
                    [today]: updatedActivity
                };

                // Calculate new streak
                const newStreak = calculateStreak(newCurrentActivity, today);
                const newLongestStreak = Math.max(currentState.longestStreak, newStreak);

                set({
                    currentActivity: newCurrentActivity,
                    currentStreak: newStreak,
                    longestStreak: newLongestStreak,
                    lastActivityDate: today
                });
            },

            unrecordSolve: (problemId: string) => {
                const state = get();
                const today = getDateKey();

                const existingActivity = state.currentActivity[today];
                if (!existingActivity || !existingActivity.problemIds.includes(problemId)) {
                    return; // Nothing to unrecord
                }

                const updatedActivity: DailyActivity = {
                    ...existingActivity,
                    count: Math.max(0, existingActivity.count - 1),
                    problemIds: existingActivity.problemIds.filter(id => id !== problemId)
                };

                const newCurrentActivity = {
                    ...state.currentActivity,
                    [today]: updatedActivity
                };

                // Recalculate streak
                const newStreak = calculateStreak(newCurrentActivity, today);

                set({
                    currentActivity: newCurrentActivity,
                    currentStreak: newStreak
                });
            },

            getDayActivity: (date: string): DailyActivity | null => {
                const state = get();
                return state.currentActivity[date] || null;
            },

            getCurrentMonthDays: (): DailyActivity[] => {
                const state = get();
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const daysInMonth = getDaysInMonth(year, month);

                const days: DailyActivity[] = [];
                for (let d = 1; d <= daysInMonth; d++) {
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const activity = state.currentActivity[dateKey];
                    days.push(activity || { date: dateKey, count: 0, problemIds: [] });
                }

                return days;
            },

            getMonthData: (monthKey: string): MonthlyRecord | null => {
                const state = get();
                return state.history[monthKey] || null;
            },

            getAllMonthKeys: (): string[] => {
                const state = get();
                const keys = Object.keys(state.history).sort().reverse();
                return keys;
            }
        }),
        {
            name: 'nexus-leetcode-activity'
        }
    )
);

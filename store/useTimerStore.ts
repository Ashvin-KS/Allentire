import { create } from 'zustand';

interface TimerState {
    timeLeft: number;      // seconds remaining
    totalTime: number;     // total session time (for progress calculation)
    isActive: boolean;     // is timer running
    intervalId: number | null;

    // Actions
    start: () => void;
    pause: () => void;
    reset: (duration?: number) => void;
    setDuration: (minutes: number) => void;
}

export const useTimerStore = create<TimerState>()((set, get) => ({
    timeLeft: 25 * 60,     // 25 minutes default
    totalTime: 25 * 60,
    isActive: false,
    intervalId: null,

    start: () => {
        // Don't start if already active or no time left
        if (get().isActive || get().timeLeft <= 0) return;

        const id = window.setInterval(() => {
            const current = get().timeLeft;
            if (current <= 1) {
                // Timer complete
                get().pause();
                set({ timeLeft: 0 });
                // Optional: Play completion sound or notification here
            } else {
                set({ timeLeft: current - 1 });
            }
        }, 1000);

        set({ isActive: true, intervalId: id });
    },

    pause: () => {
        const id = get().intervalId;
        if (id) {
            window.clearInterval(id);
        }
        set({ isActive: false, intervalId: null });
    },

    reset: (duration?: number) => {
        // Stop any running interval
        const id = get().intervalId;
        if (id) {
            window.clearInterval(id);
        }

        const newDuration = duration ?? get().totalTime;
        set({
            timeLeft: newDuration,
            totalTime: newDuration,
            isActive: false,
            intervalId: null
        });
    },

    setDuration: (minutes: number) => {
        const seconds = minutes * 60;
        set({
            timeLeft: seconds,
            totalTime: seconds
        });
    }
}));

// Helper to format time
export const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

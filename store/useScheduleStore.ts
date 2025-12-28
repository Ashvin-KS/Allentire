import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Task {
    id: number;
    title: string;
    description?: string;
    dueDate?: string; // YYYY-MM-DD
    tag: 'Work' | 'Health' | 'Study' | 'Life';
    color: 'blue' | 'orange' | 'emerald' | 'gray';
    googleId?: string;
    googleTaskListId?: string;
}

export interface ScheduleEvent {
    id: number;
    googleId?: string; // ID from Google Calendar
    title: string;
    date: string;      // YYYY-MM-DD
    timeStart: string; // HH:MM format (24h)
    duration: number;  // minutes
    type: 'focus' | 'break' | 'meeting' | 'work';
}

interface ScheduleState {
    tasks: Task[];
    events: ScheduleEvent[];
    isGoogleConnected: boolean;

    // Task actions
    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (id: number, updates: Partial<Omit<Task, 'id'>>) => void;
    deleteTask: (id: number) => void;
    completeTask: (id: number) => void;

    // Event actions
    addEvent: (event: Omit<ScheduleEvent, 'id'>, syncToGoogle?: boolean) => Promise<void>;
    updateEvent: (id: number, updates: Partial<Omit<ScheduleEvent, 'id'>>, syncToGoogle?: boolean) => Promise<void>;
    deleteEvent: (id: number, syncToGoogle?: boolean) => Promise<void>;

    // Google Actions
    checkGoogleAuth: () => Promise<void>;
    connectGoogle: () => Promise<void>;
    disconnectGoogle: () => Promise<void>;
    syncWithGoogle: (startDate?: Date, endDate?: Date) => Promise<void>;
    syncTasksWithGoogle: () => Promise<void>;
}

// Helper to get YYYY-MM-DD
const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Default data so the schedule isn't empty on first load
const defaultTasks: Task[] = [
    { id: 1, title: "Review Pull Request", tag: "Work", color: "blue" },
    { id: 2, title: "Gym (Leg Day)", tag: "Health", color: "orange" },
    { id: 3, title: "LeetCode Graph Problems", tag: "Study", color: "emerald" },
    { id: 4, title: "System Design Video", tag: "Study", color: "emerald" },
    { id: 5, title: "Grocery Run", tag: "Life", color: "gray" },
];

const defaultEvents: ScheduleEvent[] = [
    { id: 101, title: "Deep Work Session", date: getTodayString(), timeStart: "09:00", duration: 120, type: "focus" },
    { id: 102, title: "Lunch Break", date: getTodayString(), timeStart: "12:00", duration: 60, type: "break" },
    { id: 103, title: "Team Sync", date: getTodayString(), timeStart: "14:00", duration: 60, type: "meeting" },
    { id: 104, title: "Code Review", date: getTodayString(), timeStart: "15:30", duration: 90, type: "work" },
];

export const useScheduleStore = create<ScheduleState>()(
    persist(
        (set, get) => ({
            tasks: defaultTasks,
            events: defaultEvents,
            isGoogleConnected: false,

            addTask: async (task) => {
                const id = Date.now();
                let googleId: string | undefined;

                console.log('addTask called. isGoogleConnected:', get().isGoogleConnected);
                console.log('Task data:', task);

                if (get().isGoogleConnected) {
                    try {
                        console.log('Attempting to add to Google Tasks...');
                        // @ts-ignore
                        const result = await window.nexusAPI.google.tasks.add(undefined, {
                            title: task.title,
                            notes: task.description,
                            due: task.dueDate
                        });
                        console.log('Google Tasks API result:', result);
                        if (typeof result === 'string') {
                            googleId = result;
                        } else if (result && (result as any).error) {
                            console.error('Google Tasks API Error:', (result as any).error);
                        }
                    } catch (e) {
                        console.error("Failed to add Google Task:", e);
                    }
                } else {
                    console.log('Not connected to Google, skipping sync');
                }

                set((state) => ({
                    tasks: [...state.tasks, { ...task, id, googleId }],
                }));
            },

            updateTask: async (id, updates) => {
                const task = get().tasks.find(t => t.id === id);

                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                }));

                if (task && task.googleId && get().isGoogleConnected) {
                    try {
                        // @ts-ignore
                        await window.nexusAPI.google.tasks.update(undefined, task.googleId, { title: updates.title });
                    } catch (e) {
                        console.error("Failed to update Google Task:", e);
                    }
                }
            },

            deleteTask: async (id) => {
                const task = get().tasks.find(t => t.id === id);

                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== id),
                }));

                if (task && task.googleId && get().isGoogleConnected) {
                    try {
                        // @ts-ignore
                        await window.nexusAPI.google.tasks.delete(undefined, task.googleId);
                    } catch (e) {
                        console.error("Failed to delete Google Task:", e);
                    }
                }
            },

            completeTask: async (id) => {
                console.log('Store: completeTask called for id:', id);
                const task = get().tasks.find(t => t.id === id);

                // Optimistically remove from list
                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== id),
                }));

                if (task && task.googleId && get().isGoogleConnected) {
                    console.log('Store: Syncing completion to Google Task:', task.googleId);
                    try {
                        // @ts-ignore
                        await window.nexusAPI.google.tasks.update(undefined, task.googleId, {
                            status: 'completed'
                        });
                        console.log('Store: Google Task marked completed');
                    } catch (e) {
                        console.error("Failed to complete Google Task:", e);
                    }
                } else {
                    console.log('Store: Task not synced to Google or not connected');
                }
            },

            addEvent: async (event, syncToGoogle = false) => {
                const id = Date.now();
                let googleId: string | undefined;

                if (syncToGoogle && get().isGoogleConnected) {
                    const [year, month, day] = event.date.split('-').map(Number);
                    const [h, m] = event.timeStart.split(':').map(Number);
                    const start = new Date(year, month - 1, day, h, m, 0, 0);
                    const end = new Date(start.getTime() + event.duration * 60000);

                    try {
                        // @ts-ignore
                        const result = await window.nexusAPI.google.addEvent({
                            title: event.title,
                            start: start.toISOString(),
                            end: end.toISOString()
                        });

                        if (typeof result === 'string') {
                            googleId = result;
                        }
                    } catch (e) {
                        console.error("Failed to sync to Google:", e);
                    }
                }

                set((state) => ({
                    events: [...state.events, { ...event, id, googleId }],
                }));
            },

            updateEvent: async (id, updates, syncToGoogle = false) => {
                const event = get().events.find(e => e.id === id);
                if (!event) return;

                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === id ? { ...e, ...updates } : e
                    ),
                }));

                if (syncToGoogle && get().isGoogleConnected && event.googleId) {
                    const updatedEvent = { ...event, ...updates };
                    const [year, month, day] = updatedEvent.date.split('-').map(Number);
                    const [h, m] = updatedEvent.timeStart.split(':').map(Number);
                    const start = new Date(year, month - 1, day, h, m, 0, 0);
                    const end = new Date(start.getTime() + updatedEvent.duration * 60000);

                    try {
                        // @ts-ignore
                        await window.nexusAPI.google.updateEvent(event.googleId, {
                            title: updatedEvent.title,
                            start: start.toISOString(),
                            end: end.toISOString()
                        });
                    } catch (e) {
                        console.error("Failed to update Google event:", e);
                    }
                }
            },

            deleteEvent: async (id, syncToGoogle = false) => {
                const event = get().events.find(e => e.id === id);

                set((state) => ({
                    events: state.events.filter((e) => e.id !== id),
                }));

                if (syncToGoogle && get().isGoogleConnected && event?.googleId) {
                    try {
                        // @ts-ignore
                        await window.nexusAPI.google.deleteEvent(event.googleId);
                    } catch (e) {
                        console.error("Failed to delete Google event:", e);
                    }
                }
            },

            checkGoogleAuth: async () => {
                try {
                    // @ts-ignore
                    const isConnected = await window.nexusAPI.google.checkAuth();
                    set({ isGoogleConnected: isConnected });
                } catch (e) {
                    console.error("Check auth failed:", e);
                }
            },

            connectGoogle: async () => {
                try {
                    // @ts-ignore
                    const success = await window.nexusAPI.google.signIn();
                    if (success) {
                        set({ isGoogleConnected: true });
                        get().syncWithGoogle();
                        get().syncTasksWithGoogle();
                    }
                } catch (e) {
                    console.error("Connect google failed:", e);
                }
            },

            disconnectGoogle: async () => {
                try {
                    // @ts-ignore
                    await window.nexusAPI.google.signOut();
                    set({ isGoogleConnected: false });
                } catch (e) {
                    console.error("Disconnect google failed:", e);
                }
            },

            syncWithGoogle: async (startDate, endDate) => {
                if (!get().isGoogleConnected) return;

                let start: Date;
                let end: Date;

                // Default to today if no range provided
                if (!startDate || !endDate) {
                    const now = new Date();
                    start = new Date(now.setHours(0, 0, 0, 0));
                    end = new Date(now.setHours(23, 59, 59, 999));
                } else {
                    start = startDate;
                    end = endDate;
                }

                try {
                    // @ts-ignore
                    const googleEvents = await window.nexusAPI.google.listEvents(start.toISOString(), end.toISOString());

                    if (Array.isArray(googleEvents)) {
                        const currentEvents = get().events;

                        const mappedGoogleEvents: ScheduleEvent[] = googleEvents.map((ge: any) => {
                            const eventStart = new Date(ge.start);
                            const eventEnd = new Date(ge.end);
                            const duration = (eventEnd.getTime() - eventStart.getTime()) / 60000;
                            const timeStart = eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            const dateStr = `${eventStart.getFullYear()}-${String(eventStart.getMonth() + 1).padStart(2, '0')}-${String(eventStart.getDate()).padStart(2, '0')}`;

                            const existing = currentEvents.find(ce => ce.googleId === ge.id);

                            return {
                                id: existing ? existing.id : Date.now() + Math.random(),
                                googleId: ge.id,
                                title: ge.title,
                                date: dateStr,
                                timeStart: timeStart,
                                duration: duration,
                                type: existing ? existing.type : 'meeting'
                            };
                        });

                        const mergedEvents = currentEvents.filter(e => {
                            // Keep if local only
                            if (!e.googleId) return true;
                            // Keep if it belongs to a different day/range than what we just fetched
                            const eDate = new Date(e.date + 'T' + e.timeStart);
                            return !(eDate >= start && eDate <= end);
                        });

                        set({ events: [...mergedEvents, ...mappedGoogleEvents] });
                    }
                } catch (e) {
                    console.error("Sync failed:", e);
                }
            },

            syncTasksWithGoogle: async () => {
                if (!get().isGoogleConnected) return;

                try {
                    // @ts-ignore
                    const googleTasks = await window.nexusAPI.google.tasks.list();
                    if (Array.isArray(googleTasks)) {
                        const currentTasks = get().tasks;

                        const localOnlyTasks = currentTasks.filter(t => !t.googleId);

                        const mappedGoogleTasks: Task[] = googleTasks.map((gt: any) => {
                            const existing = currentTasks.find(ct => ct.googleId === gt.id);

                            return {
                                id: existing ? existing.id : Date.now() + Math.random(),
                                title: gt.title,
                                googleId: gt.id,
                                tag: existing ? existing.tag : 'Work',
                                color: existing ? existing.color : 'gray'
                            };
                        });

                        set({ tasks: [...localOnlyTasks, ...mappedGoogleTasks] });
                    }
                } catch (e) {
                    console.error("Task sync failed:", e);
                }
            }
        }),
        {
            name: 'schedule-storage',
        }
    )
);

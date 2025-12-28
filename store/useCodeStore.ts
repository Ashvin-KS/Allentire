import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Problem {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    url: string;
    isSolved: boolean;
    notes?: string;
    lastPracticed?: string;
}

interface CodeState {
    problems: Problem[];
    activeProblemId: string | null;

    // Actions
    setProblems: (problems: Problem[]) => void;
    addProblem: (problem: Omit<Problem, 'id' | 'isSolved'>) => void;
    removeProblem: (id: string) => void;
    toggleSolved: (id: string) => void;
    updateNotes: (id: string, notes: string) => void;
    setActiveProblem: (id: string | null) => void;
}

const DEFAULT_PROBLEMS: Problem[] = [
    { id: '1', title: 'Two Sum', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum', isSolved: false },
    { id: '2', title: 'LRU Cache', difficulty: 'Medium', url: 'https://leetcode.com/problems/lru-cache', isSolved: false },
    { id: '3', title: 'Merge k Sorted Lists', difficulty: 'Hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists', isSolved: false },
    { id: '4', title: 'Trapping Rain Water', difficulty: 'Hard', url: 'https://leetcode.com/problems/trapping-rain-water', isSolved: false },
    { id: '5', title: 'Valid Parentheses', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-parentheses', isSolved: false },
];

export const useCodeStore = create<CodeState>()(
    persist(
        (set) => ({
            problems: DEFAULT_PROBLEMS,
            activeProblemId: null,

            setProblems: (problems) => set({ problems }),

            addProblem: (problem) => set((state) => ({
                problems: [
                    ...state.problems,
                    {
                        ...problem,
                        id: crypto.randomUUID(),
                        isSolved: false
                    }
                ]
            })),

            removeProblem: (id) => set((state) => ({
                problems: state.problems.filter((p) => p.id !== id)
            })),

            toggleSolved: (id) => set((state) => ({
                problems: state.problems.map((p) =>
                    p.id === id ? { ...p, isSolved: !p.isSolved } : p
                )
            })),

            updateNotes: (id, notes) => set((state) => ({
                problems: state.problems.map((p) =>
                    p.id === id ? { ...p, notes } : p
                )
            })),

            setActiveProblem: (id) => set({ activeProblemId: id }),
        }),
        {
            name: 'nexus-code-store',
        }
    )
);

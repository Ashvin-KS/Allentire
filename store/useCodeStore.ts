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
    category?: string;
    technique?: string;
}

interface CodeState {
    problems: Problem[];
    activeProblemId: string | null;
    selectedCategory: string | null;

    // Actions
    setProblems: (problems: Problem[]) => void;
    addProblem: (problem: Omit<Problem, 'id' | 'isSolved'>) => void;
    removeProblem: (id: string) => void;
    toggleSolved: (id: string) => void;
    updateNotes: (id: string, notes: string) => void;
    setActiveProblem: (id: string | null) => void;
    setSelectedCategory: (category: string | null) => void;
    importFromCsv: (csvContent: string) => void;
}

const DEFAULT_PROBLEMS: Problem[] = [
    { id: '1', title: 'Two Sum', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum', isSolved: false, category: 'Array & Hashing', technique: 'Hash Map' },
    { id: '2', title: 'LRU Cache', difficulty: 'Medium', url: 'https://leetcode.com/problems/lru-cache', isSolved: false, category: 'Linked List', technique: 'Hash Map & DLL' },
];

export const useCodeStore = create<CodeState>()(
    persist(
        (set) => ({
            problems: DEFAULT_PROBLEMS,
            activeProblemId: null,
            selectedCategory: null,

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

            setSelectedCategory: (category) => set({ selectedCategory: category }),

            importFromCsv: (csvContent) => {
                const lines = csvContent.split('\n');
                const headers = lines[0].split(',');
                const problems: Problem[] = [];

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Basic CSV parsing (not handling quoted commas for simplicity as per leetcode_problems.csv)
                    const parts = line.split(',');
                    if (parts.length < 4) continue;

                    const category = parts[0];
                    const problemNo = parts[1];
                    const link = parts[2].trim();
                    const name = parts[3];
                    const technique = parts[4];
                    const isSolved = parts[5]?.toLowerCase() === 'true' || parts[5]?.toLowerCase() === 'yes';

                    problems.push({
                        id: `csv-${problemNo}-${crypto.randomUUID().slice(0, 8)}`,
                        title: name,
                        url: link,
                        difficulty: 'Medium', // Defaulting as it's not in CSV
                        isSolved,
                        category,
                        technique
                    });
                }

                if (problems.length > 0) {
                    set({ problems });
                }
            },
        }),
        {
            name: 'nexus-code-store',
        }
    )
);

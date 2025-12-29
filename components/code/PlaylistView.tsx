import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    CheckCircle,
    ChevronRight,
    Folder,
    FolderOpen,
    RotateCcw,
    Sparkles,
    Zap
} from 'lucide-react';
import { Problem } from '../../store/useCodeStore';

interface PlaylistProps {
    problems: Problem[];
    onSelect: (id: string) => void;
    onAdd: (problem: Omit<Problem, 'id' | 'isSolved'> & { category?: string }) => void;
    onRemove: (id: string) => void;
    onToggle: (id: string) => void;
}

const ProblemCard: React.FC<{
    problem: Problem;
    onSelect: (id: string) => void;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    compact?: boolean;
}> = ({ problem, onSelect, onToggle, onRemove, compact }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`group bg-[#161616] border border-[#262626] hover:border-cyan-500/50 hover:bg-[#1a1a1a] rounded-2xl cursor-pointer transition-all duration-500 flex items-center justify-between shadow-xl active:scale-[0.99] ${compact ? 'p-5' : 'p-6'}`}
    >
        <div className="flex items-center gap-6 flex-1" onClick={() => onSelect(problem.id)}>
            <div className={`
        w-1.5 ${compact ? 'h-14' : 'h-16'} rounded-full 
        ${problem.difficulty === 'Easy' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' :
                    problem.difficulty === 'Medium' ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' :
                        'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}
      `}></div>

            <div className="flex-1">
                <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-gray-100 group-hover:text-cyan-400 transition-colors mb-2`}>
                    {problem.title}
                </h3>
                <div className="flex items-center gap-4">
                    <span className={`
            text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border
            ${problem.difficulty === 'Easy' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' :
                            problem.difficulty === 'Medium' ? 'text-orange-500 border-orange-500/30 bg-orange-500/5' :
                                'text-red-500 border-red-500/30 bg-red-500/5'}
          `}>
                        {problem.difficulty}
                    </span>
                    {problem.category && (
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-gray-700" />
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{problem.category}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(problem.id); }}
                className={`p-3 rounded-xl border border-[#262626] transition-all outline-none ${problem.isSolved ? 'text-emerald-500 border-emerald-500/40 bg-emerald-500/5' : 'text-gray-600 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5'}`}
                title={problem.isSolved ? "Mark Unsolved" : "Mark Solved"}
            >
                <CheckCircle size={22} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(problem.id); }}
                className="p-3 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-red-500/10"
                title="Delete"
            >
                <Trash2 size={22} />
            </button>
            <div
                onClick={() => onSelect(problem.id)}
                className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl bg-[#262626] flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all ml-2 shadow-2xl`}
            >
                <ChevronRight size={compact ? 20 : 24} strokeWidth={3} />
            </div>
        </div>
    </motion.div>
);

export const PlaylistView: React.FC<PlaylistProps> = ({ problems, onSelect, onAdd, onRemove, onToggle }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProblem, setNewProblem] = useState({
        title: '',
        url: '',
        difficulty: 'Medium' as Problem['difficulty'],
        category: ''
    });

    const [expandedSolved, setExpandedSolved] = useState<Set<string>>(new Set());
    const [expandedUnsolved, setExpandedUnsolved] = useState<Set<string>>(new Set());

    const toggleSolvedCat = (cat: string) => {
        const next = new Set(expandedSolved);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        setExpandedSolved(next);
    };

    const toggleUnsolvedCat = (cat: string) => {
        const next = new Set(expandedUnsolved);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        setExpandedUnsolved(next);
    };

    const groupByCategory = (list: Problem[]) => {
        const groups: Record<string, Problem[]> = {};
        list.forEach(p => {
            const cat = p.category || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });
        return groups;
    };

    const solvedByCategory = useMemo(() => groupByCategory(problems.filter(p => p.isSolved)), [problems]);
    const unsolvedByCategory = useMemo(() => groupByCategory(problems.filter(p => !p.isSolved)), [problems]);

    const solvedCategories = Object.keys(solvedByCategory).sort();
    const unsolvedCategories = Object.keys(unsolvedByCategory).sort();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProblem.title && newProblem.url) {
            onAdd({
                title: newProblem.title,
                url: newProblem.url,
                difficulty: newProblem.difficulty,
                category: newProblem.category || undefined
            });
            setShowAddModal(false);
            setNewProblem({ title: '', url: '', difficulty: 'Medium', category: '' });
        }
    };

    return (
        <div className="h-full w-full flex flex-col md:flex-row overflow-hidden bg-[#0a0a0a]">

            {/* --- LEFT PANE: MASTERED VAULT --- */}
            <div className="w-full md:w-1/2 bg-[#0d0d0d] border-r border-[#262626] flex flex-col overflow-y-auto custom-scrollbar">
                <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-emerald-400 mb-2 tracking-tight flex items-center gap-3 italic">
                            MASTERED
                            <Sparkles size={24} className="text-emerald-500 fill-emerald-500/20" />
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">Patterns secured in your memory.</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-emerald-500/40 font-mono leading-none">
                            {(problems.filter(p => p.isSolved).length)}
                        </span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Archive</span>
                    </div>
                </div>

                <div className="px-8 space-y-4 pb-20">
                    {solvedCategories.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-gray-600 bg-black/40 border border-dashed border-[#262626] rounded-3xl mx-2">
                            <Folder size={48} className="mb-4 opacity-10" />
                            <p className="text-sm italic text-center px-10">Vault is empty. Solve your first problem to start the archive.</p>
                        </div>
                    ) : (
                        solvedCategories.map(cat => (
                            <div key={cat} className="group flex flex-col">
                                <button
                                    onClick={() => toggleSolvedCat(cat)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 border ${expandedSolved.has(cat)
                                            ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.08)]'
                                            : 'bg-[#161616] border-[#262626] text-gray-300 font-bold hover:border-emerald-500/40 hover:bg-emerald-500/5'
                                        }`}
                                >
                                    {expandedSolved.has(cat) ? <FolderOpen size={20} className="text-emerald-500" /> : <Folder size={20} className="text-gray-500" />}
                                    <span className="text-lg font-bold truncate">{cat}</span>
                                    <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg font-mono border border-emerald-500/20">
                                        {solvedByCategory[cat].length} SECURED
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {expandedSolved.has(cat) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden flex flex-col gap-4 mt-6 ml-4"
                                        >
                                            {solvedByCategory[cat].map(p => (
                                                <ProblemCard
                                                    key={p.id}
                                                    problem={p}
                                                    onSelect={onSelect}
                                                    onToggle={onToggle}
                                                    onRemove={onRemove}
                                                    compact
                                                />
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- RIGHT PANE: THE GRIND --- */}
            <div className="w-full md:w-1/2 flex flex-col bg-[#0a0a0a] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center gap-3 italic">
                            THE GRIND
                            <Zap size={24} className="text-cyan-400 fill-cyan-400/20 animate-pulse" />
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">Active progress in real-time.</p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-2.5 bg-white text-black font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center gap-2 text-sm"
                    >
                        <Plus size={18} strokeWidth={4} />
                        ADD NEW
                    </button>
                </div>

                {/* Add Problem Form Overlay */}
                <AnimatePresence>
                    {showAddModal && (
                        <div className="px-8 shrink-0">
                            <motion.form
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                onSubmit={handleSubmit}
                                className="bg-[#161616] border border-[#262626] p-6 rounded-3xl mb-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative z-10"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Problem Title"
                                        className="col-span-2 bg-[#0a0a0a] border border-[#333] rounded-2xl px-5 py-4 text-white focus:border-cyan-500 outline-none transition-all placeholder:text-gray-600 font-bold"
                                        value={newProblem.title}
                                        onChange={e => setNewProblem({ ...newProblem, title: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="url"
                                        placeholder="LeetCode URL"
                                        className="col-span-2 bg-[#0a0a0a] border border-[#333] rounded-2xl px-5 py-4 text-white focus:border-cyan-500 outline-none transition-all"
                                        value={newProblem.url}
                                        onChange={e => setNewProblem({ ...newProblem, url: e.target.value })}
                                        required
                                    />
                                    <select
                                        className="bg-[#0a0a0a] border border-[#333] rounded-2xl px-5 py-4 text-gray-300 outline-none focus:border-cyan-500 font-bold"
                                        value={newProblem.difficulty}
                                        onChange={e => setNewProblem({ ...newProblem, difficulty: e.target.value as any })}
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Category"
                                        className="bg-[#0a0a0a] border border-[#333] rounded-2xl px-5 py-4 text-white focus:border-cyan-500 outline-none font-bold"
                                        value={newProblem.category}
                                        onChange={e => setNewProblem({ ...newProblem, category: e.target.value })}
                                    />
                                    <div className="col-span-2 flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 text-gray-500 hover:text-white font-black transition-colors uppercase tracking-widest text-xs">CANCEL</button>
                                        <button type="submit" className="px-8 py-2 bg-white text-black font-black rounded-2xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] uppercase tracking-widest text-xs">CREATE TASK</button>
                                    </div>
                                </div>
                            </motion.form>
                        </div>
                    )}
                </AnimatePresence>

                {/* Unsolved Problems List */}
                <div className="px-8 pb-20 space-y-4">
                    {unsolvedCategories.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-gray-600">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-cyan-500/10 flex items-center justify-center mb-8 rotate-12 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                                <CheckCircle size={48} className="text-cyan-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">QUOTA ACHIEVED</h3>
                            <p className="text-sm font-medium">All active tasks have been secured. Rest or add more?</p>
                        </div>
                    ) : (
                        unsolvedCategories.map(cat => (
                            <div key={cat} className="group flex flex-col">
                                <button
                                    onClick={() => toggleUnsolvedCat(cat)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 border ${expandedUnsolved.has(cat)
                                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.08)]'
                                            : 'bg-[#161616] border-[#262626] text-gray-100 font-bold hover:border-cyan-500/40'
                                        }`}
                                >
                                    {expandedUnsolved.has(cat) ? <FolderOpen size={22} className="text-cyan-400" /> : <Folder size={22} className="text-gray-500" />}
                                    <span className="text-lg font-black truncate">{cat}</span>
                                    <span className="ml-auto text-xs bg-cyan-500/10 text-cyan-500 px-3 py-1 rounded-lg font-mono border border-cyan-500/20">
                                        {unsolvedByCategory[cat].length} ACTIVE
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {expandedUnsolved.has(cat) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden flex flex-col gap-4 mt-6 ml-4"
                                        >
                                            {unsolvedByCategory[cat].map(p => (
                                                <ProblemCard
                                                    key={p.id}
                                                    problem={p}
                                                    onSelect={onSelect}
                                                    onToggle={onToggle}
                                                    onRemove={onRemove}
                                                />
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

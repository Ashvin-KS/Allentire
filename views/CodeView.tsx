import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useCodeStore } from '../store/useCodeStore';
import { PlaylistView } from '../components/code/PlaylistView';
import { SplitWorkspace } from '../components/code/SplitWorkspace';

export const CodeView: React.FC = () => {
  const { problems, activeProblemId, setActiveProblem, addProblem, removeProblem, toggleSolved, importProblems } = useCodeStore();
  const activeProblem = problems.find(p => p.id === activeProblemId) || null;

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Initial Import of problems from categorized list
  useEffect(() => {
    // Only import if we only have the default few problems
    if (problems.length <= 5) {
      const initialProblems = [
        // Two Pointers
        { title: 'Shortest Word Distance', url: 'https://leetcode.com/problems/shortest-word-distance', difficulty: 'Easy', category: 'Two Pointers' } as const,
        { title: 'Majority Element', url: 'https://leetcode.com/problems/majority-element', difficulty: 'Easy', category: 'Array & Hashing' } as const,
        { title: 'Rotate Array', url: 'https://leetcode.com/problems/rotate-array', difficulty: 'Medium', category: 'Two Pointers' } as const,
        { title: 'Merge Intervals', url: 'https://leetcode.com/problems/merge-intervals', difficulty: 'Medium', category: 'Intervals' } as const,
        { title: '3Sum', url: 'https://leetcode.com/problems/3sum', difficulty: 'Medium', category: 'Two Pointers' } as const,
        { title: 'Minimum Window Substring', url: 'https://leetcode.com/problems/minimum-window-substring', difficulty: 'Hard', category: 'Sliding Window' } as const,
        { title: 'Trapping Rain Water', url: 'https://leetcode.com/problems/trapping-rain-water', difficulty: 'Hard', category: 'Two Pointers' } as const,
        // Add a few more to populate the initial UI
        { title: 'Product of Array Except Self', url: 'https://leetcode.com/problems/product-of-array-except-self', difficulty: 'Medium', category: 'Array & Hashing' } as const,
        { title: 'Longest Substring Without Repeating Characters', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters', difficulty: 'Medium', category: 'Sliding Window' } as const,
        { title: 'First Missing Positive', url: 'https://leetcode.com/problems/first-missing-positive', difficulty: 'Hard', category: 'Cyclic Sort' } as const,
      ];
      importProblems(initialProblems);
    }
  }, []);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden rounded-xl border border-[#262626]">
      <AnimatePresence mode="wait">
        {!activeProblem ? (
          <PlaylistView
            key="playlist"
            problems={problems}
            onSelect={(id) => setActiveProblem(id)}
            onAdd={addProblem}
            onRemove={removeProblem}
            onToggle={toggleSolved}
          />
        ) : (
          <SplitWorkspace
            key="workspace"
            problem={activeProblem}
            onBack={() => setActiveProblem(null)}
            onNotify={showNotification}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 z-50"
          >
            <div className="bg-emerald-500/20 p-1 rounded-full">
              <CheckCircle size={16} />
            </div>
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

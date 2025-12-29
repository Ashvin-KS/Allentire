import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  FileJson,
  Save,
  Lock,
  RotateCcw,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  Send,
  Code,
  Lightbulb,
  Layers,
  StopCircle,
  ChevronDown,
  GripVertical,
  LayoutGrid,
  RefreshCw,
  Search
} from 'lucide-react';
import { useCodeStore, Problem } from '../store/useCodeStore';

// --- AI Response Types ---
interface AiResponse {
  explanation: string;
  code: string;
  pattern: string;
}

// --- Markdown Styles ---
const MARKDOWN_STYLES = {
  h1: "text-xl font-bold text-white mt-4 mb-2",
  h2: "text-lg font-bold text-white mt-4 mb-2",
  h3: "text-base font-semibold text-white mt-3 mb-2",
  p: "text-gray-300 my-2 leading-relaxed text-sm",
  ul: "list-disc list-inside text-gray-300 my-2 space-y-1 ml-2 text-sm",
  ol: "list-decimal list-inside text-gray-300 my-2 space-y-1 ml-2 text-sm",
  li: "text-gray-300 text-sm",
  codeInline: "bg-[#262626] px-1.5 py-0.5 rounded text-purple-300 text-xs font-mono",
  codeBlock: "bg-[#1a1a1a] p-3 rounded-lg overflow-x-auto text-xs my-2 border border-[#333] text-gray-300 font-mono",
  a: "text-blue-400 hover:underline cursor-pointer",
  blockquote: "border-l-4 border-purple-500 pl-3 text-gray-400 my-2 italic text-sm",
};

// Mini Markdown Renderer for AI bubbles
const MiniMarkdown: React.FC<{ content: string }> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => <h1 className={MARKDOWN_STYLES.h1}>{children}</h1>,
      h2: ({ children }) => <h2 className={MARKDOWN_STYLES.h2}>{children}</h2>,
      h3: ({ children }) => <h3 className={MARKDOWN_STYLES.h3}>{children}</h3>,
      p: ({ children }) => <p className={MARKDOWN_STYLES.p}>{children}</p>,
      ul: ({ children }) => <ul className={MARKDOWN_STYLES.ul}>{children}</ul>,
      ol: ({ children }) => <ol className={MARKDOWN_STYLES.ol}>{children}</ol>,
      li: ({ children }) => <li className={MARKDOWN_STYLES.li}>{children}</li>,
      a: ({ href, children }) => <a href={href} className={MARKDOWN_STYLES.a} target="_blank" rel="noopener noreferrer">{children}</a>,
      blockquote: ({ children }) => <blockquote className={MARKDOWN_STYLES.blockquote}>{children}</blockquote>,
      code: ({ className, children }) => {
        const isBlock = className?.includes('language-');
        return isBlock ? (
          <pre className={MARKDOWN_STYLES.codeBlock}><code>{children}</code></pre>
        ) : (
          <code className={MARKDOWN_STYLES.codeInline}>{children}</code>
        );
      },
    }}
  >
    {content}
  </ReactMarkdown>
);


export const CodeView: React.FC = () => {
  const { problems, activeProblemId, setActiveProblem, addProblem, removeProblem, toggleSolved, selectedCategory, setSelectedCategory, importFromCsv } = useCodeStore();
  const activeProblem = problems.find(p => p.id === activeProblemId) || null;

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSyncCsv = async () => {
    try {
      // @ts-ignore
      const leetcodeApi = window.nexusAPI?.leetcode;
      if (!leetcodeApi) {
        console.warn("LeetCode API not found on window.nexusAPI");
        return false;
      }

      const csvContent = await leetcodeApi.readCsv();
      if (csvContent) {
        importFromCsv(csvContent);
        showNotification("Problems synced from CSV!");
        return true;
      } else {
        showNotification("Could not find CSV file.");
        return false;
      }
    } catch (err) {
      console.error(err);
      showNotification("Sync failed.");
      return false;
    }
  };

  // Auto-sync on mount if only default problems exist or if list is empty
  useEffect(() => {
    if (problems.length <= 2) {
      handleSyncCsv();
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden rounded-xl border border-[#262626]">
      <AnimatePresence mode="wait">
        {activeProblem ? (
          <SplitWorkspace
            key="workspace"
            problem={activeProblem}
            onBack={() => setActiveProblem(null)}
            onNotify={showNotification}
          />
        ) : !selectedCategory ? (
          <CategoryGrid
            key="categories"
            problems={problems}
            onSelectCategory={setSelectedCategory}
            onSync={handleSyncCsv}
          />
        ) : (
          <ProblemListView
            key="problems"
            category={selectedCategory}
            problems={problems.filter(p => p.category === selectedCategory)}
            onBack={() => setSelectedCategory(null)}
            onSelectProblem={setActiveProblem}
            onToggleSolved={toggleSolved}
            onRemove={removeProblem}
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

// --- Sub-View: Category Grid ---

interface CategoryGridProps {
  problems: Problem[];
  onSelectCategory: (cat: string) => void;
  onSync: () => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ problems, onSelectCategory, onSync }) => {
  const categories = Array.from(new Set(problems.map(p => p.category || 'Other'))).sort();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full w-full flex flex-col p-8 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Leet Code Grind</h1>
            <p className="text-gray-500 text-sm">Select a category to view problems and start practice.</p>
          </div>
          <button
            onClick={onSync}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#262626] text-gray-300 border border-[#333] rounded-lg transition-all active:scale-95"
          >
            <RefreshCw size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Sync CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => {
            const catProblems = problems.filter(p => (p.category || 'Other') === cat);
            const solvedCount = catProblems.filter(p => p.isSolved).length;
            const progress = (solvedCount / catProblems.length) * 100;

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onSelectCategory(cat)}
                className="group relative bg-[#111] border border-[#262626] hover:border-cyan-500/50 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-[#161616] overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500 transition-colors" />

                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                    <LayoutGrid size={20} />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 bg-[#0a0a0a] px-2 py-1 rounded-full border border-[#222]">
                    {catProblems.length} PROBLEMS
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                  {cat}
                </h3>

                <div className="mt-6">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#262626] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-cyan-500"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// --- Sub-View: Problem List ---

interface ProblemListProps {
  category: string;
  problems: Problem[];
  onBack: () => void;
  onSelectProblem: (id: string) => void;
  onToggleSolved: (id: string) => void;
  onRemove: (id: string) => void;
}

const ProblemListView: React.FC<ProblemListProps> = ({ category, problems, onBack, onSelectProblem, onToggleSolved, onRemove }) => {
  const incomplete = problems.filter(p => !p.isSolved);
  const completed = problems.filter(p => p.isSolved);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full w-full flex flex-col p-8 overflow-hidden"
    >
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 bg-[#1a1a1a] hover:bg-[#262626] text-gray-400 hover:text-white rounded-xl transition-colors border border-[#333]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">{category}</h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Problem Set</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-8 min-h-0">
        {/* Incomplete Column */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Incomplete</h3>
            <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
              {incomplete.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
            {incomplete.map(problem => (
              <ProblemCard
                key={`incomplete-${problem.id}`}
                problem={problem}
                onSelect={() => onSelectProblem(problem.id)}
                onToggle={() => onToggleSolved(problem.id)}
                onRemove={() => onRemove(problem.id)}
              />
            ))}
            {incomplete.length === 0 && (
              <div className="h-32 border-2 border-dashed border-[#1a1a1a] rounded-2xl flex items-center justify-center text-gray-600 text-sm italic">
                All caught up!
              </div>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Completed</h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {completed.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
            {completed.map(problem => (
              <ProblemCard
                key={`completed-${problem.id}`}
                problem={problem}
                onSelect={() => onSelectProblem(problem.id)}
                onToggle={() => onToggleSolved(problem.id)}
                onRemove={() => onRemove(problem.id)}
              />
            ))}
            {completed.length === 0 && (
              <div className="h-32 border-2 border-dashed border-[#1a1a1a] rounded-2xl flex items-center justify-center text-gray-600 text-sm italic">
                None completed yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProblemCard: React.FC<{ problem: Problem, onSelect: () => void, onToggle: () => void, onRemove: () => void }> = ({ problem, onSelect, onToggle, onRemove }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="group bg-[#111] border border-[#222] hover:border-cyan-500/30 p-4 rounded-xl cursor-pointer transition-all hover:bg-[#161616] flex items-center justify-between"
    onClick={onSelect}
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={`w-1 h-8 rounded-full ${problem.difficulty === 'Easy' ? 'bg-emerald-500' :
        problem.difficulty === 'Medium' ? 'bg-orange-500' : 'bg-red-500'
        }`} />
      <div className="min-w-0">
        <h4 className={`text-sm font-bold truncate ${problem.isSolved ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-cyan-400'}`}>
          {problem.title}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-mono text-gray-500 uppercase">{problem.difficulty}</span>
          {problem.technique && (
            <span className="text-[9px] text-gray-600 truncate">• {problem.technique}</span>
          )}
        </div>
      </div>
    </div>

    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`p-1.5 rounded-lg transition-colors ${problem.isSolved ? 'text-emerald-500 bg-emerald-500/10' : 'text-gray-600 hover:text-emerald-400'}`}
      >
        <CheckCircle size={14} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </motion.div>
);


// --- Sub-View: Split Workspace ---

interface WorkspaceProps {
  problem: Problem;
  onBack: () => void;
  onNotify: (msg: string) => void;
}

const SplitWorkspace: React.FC<WorkspaceProps> = ({ problem, onBack, onNotify }) => {
  const [notes, setNotes] = useState(problem.notes || '');
  const { updateNotes } = useCodeStore();
  const webviewRef = useRef<any>(null);
  const [url, setUrl] = useState(problem.url);

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AiResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState('provider-5/gpt-oss-120b');
  const [availableModels, setAvailableModels] = useState<{ id: string }[]>([]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showFileExistsModal, setShowFileExistsModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{
    fullPath: string;
    fileName: string;
    category: string;
    newEntry: string;
    existingContent: string;
  } | null>(null);

  // Resizable Panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [rightTopHeight, setRightTopHeight] = useState(50); // percentage
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://api.a4f.co/v1/models', {
          headers: { 'Authorization': 'Bearer ddc-a4f-85d091a17a7e4fadb82b826aa8fb4fec' }
        });
        const data = await response.json();
        if (data.data) {
          setAvailableModels(data.data);
          const hasTargetModel = data.data.some((m: any) => m.id === 'provider-5/gpt-oss-120b');
          if (hasTargetModel) {
            setSelectedModel('provider-5/gpt-oss-120b');
          } else if (data.data.length > 0) {
            setSelectedModel(data.data[0].id);
          }
        }
      } catch (e) {
        setAvailableModels([{ id: 'provider-5/gpt-oss-120b' }]);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    setNotes(problem.notes || '');
  }, [problem.id]);

  // Horizontal Resize (Left/Right panels)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingHorizontal || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 25 && newWidth < 75) {
        setLeftPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizingHorizontal(false);

    if (isResizingHorizontal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingHorizontal]);

  // Vertical Resize (AI/Notes panels)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingVertical || !containerRef.current) return;
      const rightPanel = containerRef.current.querySelector('.right-panel') as HTMLElement;
      if (!rightPanel) return;
      const panelRect = rightPanel.getBoundingClientRect();
      const newHeight = ((e.clientY - panelRect.top) / panelRect.height) * 100;
      if (newHeight > 20 && newHeight < 80) {
        setRightTopHeight(newHeight);
      }
    };
    const handleMouseUp = () => setIsResizingVertical(false);

    if (isResizingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingVertical]);


  const handleGoBack = () => webviewRef.current?.canGoBack() && webviewRef.current.goBack();
  const handleGoForward = () => webviewRef.current?.canGoForward() && webviewRef.current.goForward();
  const handleReload = () => webviewRef.current?.reload();

  const handleSaveNotes = async (skipAiCheck = false) => {
    // If no AI response and not explicitly skipping, show custom confirm modal
    if (!aiResponse && !skipAiCheck) {
      setShowSaveConfirm(true);
      return;
    }

    updateNotes(problem.id, notes);
    try {
      // Use a fixed LeetCode notes directory structure
      const category = (problem.category || 'Uncategorized').replace(/[^a-z0-9\s&]/gi, '').trim();
      const problemName = problem.title.replace(/[^a-z0-9]/gi, '_');
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // Get vault path from localStorage (same as BrainView) or prompt if not set
      let basePath = localStorage.getItem('brain_vaultPath');

      if (!basePath) {
        // First time: ask user to select a vault (will be remembered for BrainView too)
        // @ts-ignore
        basePath = await window.nexusAPI.notes.selectVault();
        if (basePath) {
          localStorage.setItem('brain_vaultPath', basePath);
        }
      }

      if (!basePath) {
        onNotify("Note saved internally (No folder selected)");
        return;
      }

      const leetcodePath = `${basePath}/LeetCode`;
      const categoryPath = `${leetcodePath}/${category}`;
      const fileName = `${problemName}.md`;
      const fullPath = `${categoryPath}/${fileName}`;

      // Ensure directories exist
      // @ts-ignore
      await window.nexusAPI.notes.ensureDir(categoryPath);

      // Check if file exists and read existing content
      let existingContent = '';
      try {
        // @ts-ignore
        existingContent = await window.nexusAPI.notes.readFile(fullPath) || '';
      } catch {
        // File doesn't exist yet, will create new
      }

      // Build the new entry
      let newEntry = `\n---\n\n## Session: ${date} at ${time}\n\n`;

      // User's notes first
      if (notes.trim()) {
        newEntry += `### My Notes\n\n${notes}\n\n`;
      }

      // AI Analysis second (explanation + code + pattern)
      if (aiResponse) {
        newEntry += `### AI Analysis\n\n`;
        newEntry += `**Pattern/Technique:** ${aiResponse.pattern}\n\n`;
        newEntry += `#### Explanation\n${aiResponse.explanation}\n\n`;
        newEntry += `#### Code\n\`\`\`python\n${aiResponse.code}\n\`\`\`\n`;
      }

      // If file exists, show modal to ask user what to do
      if (existingContent.trim()) {
        setPendingSaveData({
          fullPath,
          fileName,
          category,
          newEntry,
          existingContent
        });
        setShowFileExistsModal(true);
        return;
      }

      // File is new, create with header
      let finalContent = `# ${problem.title}\n\n`;
      finalContent += `**URL:** ${problem.url}\n`;
      finalContent += `**Difficulty:** ${problem.difficulty}\n`;
      finalContent += `**Category:** ${category}\n`;
      if (problem.technique) {
        finalContent += `**Technique:** ${problem.technique}\n`;
      }
      finalContent += newEntry;

      // @ts-ignore
      await window.nexusAPI.notes.writeFile(fullPath, finalContent);
      onNotify(`Saved to LeetCode/${category}/${fileName}`);
    } catch (e) {
      console.error("Save failed:", e);
      onNotify("Error saving to disk");
    }
  };

  // Handle file exists modal actions
  const handleFileExistsAction = async (action: 'replace' | 'append' | 'cancel') => {
    setShowFileExistsModal(false);

    if (action === 'cancel' || !pendingSaveData) {
      setPendingSaveData(null);
      return;
    }

    const { fullPath, fileName, category, newEntry, existingContent } = pendingSaveData;

    try {
      let finalContent = '';

      if (action === 'replace') {
        // Create fresh file with header and new entry only
        finalContent = `# ${problem.title}\n\n`;
        finalContent += `**URL:** ${problem.url}\n`;
        finalContent += `**Difficulty:** ${problem.difficulty}\n`;
        finalContent += `**Category:** ${category}\n`;
        if (problem.technique) {
          finalContent += `**Technique:** ${problem.technique}\n`;
        }
        finalContent += newEntry;
      } else {
        // Append to existing content
        finalContent = existingContent + newEntry;
      }

      // @ts-ignore
      await window.nexusAPI.notes.writeFile(fullPath, finalContent);
      onNotify(`${action === 'replace' ? 'Replaced' : 'Appended to'} LeetCode/${category}/${fileName}`);
    } catch (e) {
      console.error("Save failed:", e);
      onNotify("Error saving to disk");
    } finally {
      setPendingSaveData(null);
    }
  };

  const handleAiSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || aiInput.trim();
    if (!promptToSend || isAiLoading) return;

    abortControllerRef.current = new AbortController();
    const userMessage = promptToSend;
    setAiInput('');
    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const systemPrompt = `You are a LeetCode problem-solving assistant. The user is working on the problem: "${problem.title}" (${problem.difficulty}).

When the user asks for help, you MUST respond with EXACTLY this JSON format and nothing else:
{
  "explanation": "A clear, concise explanation of the approach, intuition, and logic behind the solution. Include time and space complexity.",
  "code": "Clean, working code solution in Python (or the language they specify).",
  "pattern": "The algorithm pattern or technique used (e.g., Two Pointers, Sliding Window, Dynamic Programming, BFS/DFS, Hash Map, Binary Search, etc.)"
}

Your response must be ONLY valid JSON. Do not include any text before or after the JSON.`;

      const response = await fetch('https://api.a4f.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ddc-a4f-85d091a17a7e4fadb82b826aa8fb4fec'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          stream: false
        }),
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) throw new Error(`API error (${response.status})`);

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || '';

      // Parse JSON response
      try {
        // Try to extract JSON from the response (in case there's extra text)
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAiResponse({
            explanation: parsed.explanation || 'No explanation provided.',
            code: parsed.code || '// No code provided',
            pattern: parsed.pattern || 'Unknown'
          });
        } else {
          // Fallback: treat the whole thing as explanation
          setAiResponse({
            explanation: aiText,
            code: '// AI did not provide structured code',
            pattern: 'See explanation'
          });
        }
      } catch (parseError) {
        setAiResponse({
          explanation: aiText,
          code: '// Could not parse AI response',
          pattern: 'Unknown'
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('AI API error:', error);
      setAiResponse({
        explanation: 'Sorry, there was an error connecting to the AI.',
        code: '',
        pattern: ''
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleStopAi = () => {
    abortControllerRef.current?.abort();
    setIsAiLoading(false);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="flex h-full w-full"
    >

      {/* --- LEFT PANEL: BROWSER --- */}
      <div
        className="flex flex-col border-r border-[#262626] relative bg-black"
        style={{ width: `${leftPanelWidth}%` }}
      >
        {/* Browser Header */}
        <div className="h-12 border-b border-[#262626] flex items-center px-4 bg-[#161616] gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white mr-2" title="Back to List">
            <ArrowLeft size={16} />
          </button>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30"></div>
          </div>
          <div className="flex text-gray-500 gap-2">
            <button onClick={handleGoBack} className="hover:text-white"><ChevronLeftIcon size={16} /></button>
            <button onClick={handleGoForward} className="hover:text-white"><ChevronRightIcon size={16} /></button>
            <button onClick={handleReload} className="hover:text-white"><RotateCcw size={14} /></button>
          </div>
          <div className="flex-1 bg-[#0a0a0a] rounded-md h-7 flex items-center px-3 text-xs text-gray-400 font-mono border border-[#262626] overflow-hidden">
            <Lock size={10} className="mr-2 opacity-50 text-emerald-500 min-w-[10px]" />
            <span className="truncate">{url}</span>
          </div>
        </div>

        {/* Browser Content (Webview) */}
        <div className="flex-1 relative bg-white overflow-hidden">
          <webview
            ref={webviewRef}
            src={problem.url}
            className="w-full h-full"
            // @ts-ignore
            allowpopups="true"
            webpreferences="contextIsolation=true"
          />
        </div>
      </div>

      {/* --- HORIZONTAL RESIZE HANDLE --- */}
      <div
        onMouseDown={() => setIsResizingHorizontal(true)}
        className={`w-1.5 hover:w-2 bg-[#262626] hover:bg-cyan-500/50 cursor-col-resize z-10 transition-all flex items-center justify-center ${isResizingHorizontal ? 'bg-cyan-500' : ''}`}
      >
        <GripVertical size={12} className="text-gray-600" />
      </div>

      {/* --- RIGHT PANEL: AI + NOTES --- */}
      <div
        className="right-panel flex flex-col bg-[#111111]"
        style={{ width: `${100 - leftPanelWidth}%` }}
      >

        {/* Top: AI Chat */}
        <div
          className="flex flex-col border-b border-[#262626] overflow-hidden"
          style={{ height: `${rightTopHeight}%` }}
        >
          {/* AI Header */}
          <div className="h-10 flex items-center justify-between px-4 border-b border-[#262626] bg-[#161616] shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Nexus AI</span>
            </div>

            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-1 px-2 py-1 bg-[#262626] rounded text-[10px] text-gray-400 hover:text-white border border-[#333]"
              >
                <span className="max-w-[100px] truncate">{selectedModel}</span>
                <ChevronDown size={10} />
              </button>
              {showModelDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-[#333] rounded shadow-xl max-h-40 overflow-y-auto z-50 min-w-[150px]">
                  {availableModels.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setShowModelDropdown(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#262626] ${selectedModel === m.id ? 'text-purple-400' : 'text-gray-400'}`}
                    >
                      {m.id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Response Bubbles */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            {!aiResponse && !isAiLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-purple-400" />
                </div>
                <div className="bg-[#262626] rounded-2xl rounded-tl-sm p-3 text-sm text-gray-300 border border-[#333]">
                  Ask me about <strong className="text-white">{problem.title}</strong>! I'll give you the explanation, code, and the pattern used.
                </div>
              </div>
            )}

            {isAiLoading && (
              <div className="flex items-center gap-3 text-gray-400 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-purple-400 animate-spin" />
                </div>
                <span className="text-sm">Thinking...</span>
                <button onClick={handleStopAi} className="ml-auto text-red-400 hover:text-red-300">
                  <StopCircle size={16} />
                </button>
              </div>
            )}

            {aiResponse && (
              <div className="flex flex-col gap-3">
                {/* Bubble 1: Explanation */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={14} className="text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400 uppercase">Explanation</span>
                  </div>
                  <div className="text-gray-300 text-sm">
                    <MiniMarkdown content={aiResponse.explanation} />
                  </div>
                </div>

                {/* Bubble 2: Code */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Code size={14} className="text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 uppercase">Code</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiResponse.code);
                          onNotify('Code copied to clipboard!');
                        }}
                        className="px-2 py-1 text-[10px] bg-[#262626] hover:bg-[#333] text-gray-400 hover:text-white rounded border border-[#333] transition-colors"
                        title="Copy to Clipboard"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          if (webviewRef.current) {
                            // Escape backticks and newlines for JS string
                            const escapedCode = aiResponse.code
                              .replace(/\\/g, '\\\\')
                              .replace(/`/g, '\\`')
                              .replace(/\$/g, '\\$');

                            // LeetCode uses Monaco Editor - we target it directly
                            const script = `
                              (function() {
                                try {
                                  // Method 1: Monaco Editor API (preferred)
                                  const monacoEditor = document.querySelector('.monaco-editor');
                                  if (monacoEditor && window.monaco) {
                                    const editor = monaco.editor.getModels()[0];
                                    if (editor) {
                                      editor.setValue(\`${escapedCode}\`);
                                      return 'Monaco: Code inserted successfully!';
                                    }
                                  }
                                  
                                  // Method 2: Try CodeMirror (fallback)
                                  const codeMirror = document.querySelector('.CodeMirror');
                                  if (codeMirror && codeMirror.CodeMirror) {
                                    codeMirror.CodeMirror.setValue(\`${escapedCode}\`);
                                    return 'CodeMirror: Code inserted successfully!';
                                  }
                                  
                                  // Method 3: Direct textarea (very fallback)
                                  const textarea = document.querySelector('[data-cy="code-editor"] textarea, .view-lines');
                                  if (textarea) {
                                    return 'Found editor but could not inject. Copy manually.';
                                  }
                                  
                                  return 'Editor not found. Make sure you are on the problem page.';
                                } catch(e) {
                                  return 'Error: ' + e.message;
                                }
                              })();
                            `;

                            webviewRef.current.executeJavaScript(script)
                              .then((result: string) => onNotify(result))
                              .catch((err: Error) => onNotify('Injection failed: ' + err.message));
                          } else {
                            onNotify('Webview not ready');
                          }
                        }}
                        className="px-2 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors font-medium"
                        title="Insert directly into LeetCode editor"
                      >
                        Insert to LeetCode
                      </button>
                    </div>
                  </div>
                  <pre className="bg-[#0a0a0a] p-3 rounded-lg text-xs text-gray-300 font-mono overflow-x-auto border border-[#262626]">
                    <code>{aiResponse.code}</code>
                  </pre>
                </div>

                {/* Bubble 3: Pattern */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] rounded-xl p-4 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-400 uppercase">Pattern / Technique</span>
                  </div>
                  <p className="text-gray-300 text-sm font-medium">{aiResponse.pattern}</p>
                </div>
              </div>
            )}
          </div>

          {/* AI Input */}
          <div className="p-3 bg-[#161616] border-t border-[#262626] shrink-0">
            <div className="relative flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAiSend()}
                placeholder="Ask for help with this problem..."
                className="flex-1 bg-[#0a0a0a] border border-[#333] text-gray-300 rounded-lg pl-3 pr-3 py-2.5 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <button
                onClick={() => handleAiSend()}
                disabled={isAiLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* --- VERTICAL RESIZE HANDLE --- */}
        <div
          onMouseDown={() => setIsResizingVertical(true)}
          className={`h-1.5 hover:h-2 bg-[#262626] hover:bg-cyan-500/50 cursor-row-resize z-10 transition-all ${isResizingVertical ? 'bg-cyan-500' : ''}`}
        />

        {/* Bottom: Notes */}
        <div
          className="flex flex-col bg-[#0e0e0e]"
          style={{ height: `${100 - rightTopHeight}%` }}
        >
          <div className="h-10 flex items-center justify-between px-4 border-b border-[#262626] bg-[#161616] shrink-0">
            <div className="flex items-center gap-2">
              <FileJson size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">My Notes</span>
            </div>
          </div>

          <div className="flex-1 p-0 overflow-hidden relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your intuition, complexities, and code approach here..."
              className="w-full h-full bg-[#0e0e0e] text-gray-300 p-4 font-mono text-sm outline-none resize-none focus:bg-[#0a0a0a] transition-colors"
            />
            <div className="absolute top-2 right-2 opacity-50 text-[10px] text-gray-500 pointer-events-none">
              Markdown Supported
            </div>
          </div>

          <div className="p-4 border-t border-[#262626] bg-[#0a0a0a] shrink-0">
            <button
              onClick={() => handleSaveNotes()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all"
            >
              <Save size={16} />
              Save Notes & AI
            </button>
          </div>
        </div>

      </div>

      {/* Custom Save Confirmation Modal */}
      <AnimatePresence>
        {showSaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowSaveConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#161616] border border-[#333] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={24} className="text-orange-400" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white text-center mb-2">
                No AI Response Yet
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-center text-sm mb-6 leading-relaxed">
                You haven't asked the AI for help with this problem yet.
                Would you like to save just your notes, or go back to get AI analysis first?
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSaveConfirm(false);
                    handleAiSend('Give me the optimal solution with explanation');
                  }}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  Ask AI First
                </button>
                <button
                  onClick={() => {
                    setShowSaveConfirm(false);
                    handleSaveNotes(true);
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-900/30"
                >
                  Save Notes Only
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Exists Modal */}
      <AnimatePresence>
        {showFileExistsModal && pendingSaveData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => handleFileExistsAction('cancel')}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#161616] border border-[#333] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <FileJson size={24} className="text-blue-400" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white text-center mb-2">
                File Already Exists
              </h3>

              {/* File name display */}
              <div className="bg-[#0a0a0a] rounded-lg px-3 py-2 mb-4 border border-[#262626]">
                <p className="text-cyan-400 text-sm font-mono text-center truncate">
                  {pendingSaveData.fileName}
                </p>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-center text-sm mb-6 leading-relaxed">
                This problem already has saved notes. What would you like to do?
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleFileExistsAction('append')}
                  className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                >
                  <span className="text-emerald-200">+</span>
                  Append to Existing
                </button>
                <button
                  onClick={() => handleFileExistsAction('replace')}
                  className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-orange-200">↻</span>
                  Replace Everything
                </button>
                <button
                  onClick={() => handleFileExistsAction('cancel')}
                  className="w-full px-4 py-3 bg-[#262626] hover:bg-[#333] text-gray-300 hover:text-white rounded-xl font-medium text-sm transition-all border border-[#333]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

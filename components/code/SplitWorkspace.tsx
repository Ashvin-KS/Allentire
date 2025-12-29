import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    ArrowLeft,
    RotateCcw,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Lock,
    Sparkles,
    StopCircle,
    Lightbulb,
    Code,
    Layers,
    Send,
    FileJson,
    ChevronDown,
    GripVertical
} from 'lucide-react';
import { useCodeStore, Problem } from '../../store/useCodeStore';

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
export const MiniMarkdown: React.FC<{ content: string }> = ({ content }) => (
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

interface WorkspaceProps {
    problem: Problem;
    onBack: () => void;
    onNotify: (msg: string) => void;
}

export const SplitWorkspace: React.FC<WorkspaceProps> = ({ problem, onBack, onNotify }) => {
    const [notes, setNotes] = useState(problem.notes || '');
    const { updateNotes } = useCodeStore();
    const webviewRef = useRef<any>(null);
    const [url, setUrl] = useState(problem.url);

    // AI State
    const [aiInput, setAiInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<AiResponse | null>(null);
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [availableModels, setAvailableModels] = useState<{ id: string }[]>([]);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

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
                    if (data.data.length > 0) setSelectedModel(data.data[0].id);
                }
            } catch (e) {
                setAvailableModels([{ id: 'gpt-4o-mini' }]);
            }
        };
        fetchModels();
    }, []);

    useEffect(() => {
        setNotes(problem.notes || '');
    }, [problem.id]);

    // Horizontal Resize
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

    // Vertical Resize
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

    const handleSaveNotes = async () => {
        updateNotes(problem.id, notes);
        try {
            // @ts-ignore
            const vaultPath = await window.nexusAPI.notes.selectVault();
            if (!vaultPath) {
                onNotify("Note saved internally (No folder selected)");
                return;
            }
            const date = new Date().toISOString().split('T')[0];
            const fileName = `${problem.title.replace(/[^a-z0-9]/gi, '_')}.md`;

            let aiSection = '';
            if (aiResponse) {
                aiSection = `\n## AI Analysis\n\n### Explanation\n${aiResponse.explanation}\n\n### Code\n\`\`\`\n${aiResponse.code}\n\`\`\`\n\n### Pattern\n${aiResponse.pattern}\n`;
            }

            const content = `# ${problem.title}\n\nURL: ${problem.url}\nDifficulty: ${problem.difficulty}\nDate: ${date}\n${aiSection}\n## My Notes\n\n${notes}`;
            const fullPath = `${vaultPath}/${fileName}`;
            // @ts-ignore
            await window.nexusAPI.notes.writeFile(fullPath, content);
            onNotify(`Saved to ${fileName}`);
        } catch (e) {
            console.error("Save failed:", e);
            onNotify("Error saving to disk");
        }
    };

    const handleAiSend = async () => {
        if (!aiInput.trim() || isAiLoading) return;

        abortControllerRef.current = new AbortController();
        const userMessage = aiInput.trim();
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

            try {
                const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    setAiResponse({
                        explanation: parsed.explanation || 'No explanation provided.',
                        code: parsed.code || '// No code provided',
                        pattern: parsed.pattern || 'Unknown'
                    });
                } else {
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
            <div
                className="flex flex-col border-r border-[#262626] relative bg-black"
                style={{ width: `${leftPanelWidth}%` }}
            >
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

            <div
                onMouseDown={() => setIsResizingHorizontal(true)}
                className={`w-1.5 hover:w-2 bg-[#262626] hover:bg-cyan-500/50 cursor-col-resize z-10 transition-all flex items-center justify-center ${isResizingHorizontal ? 'bg-cyan-500' : ''}`}
            >
                <GripVertical size={12} className="text-gray-600" />
            </div>

            <div
                className="right-panel flex flex-col bg-[#111111]"
                style={{ width: `${100 - leftPanelWidth}%` }}
            >
                <div
                    className="flex flex-col border-b border-[#262626] overflow-hidden"
                    style={{ height: `${rightTopHeight}%` }}
                >
                    <div className="h-10 flex items-center justify-between px-4 border-b border-[#262626] bg-[#161616] shrink-0">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-purple-400" />
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Nexus AI</span>
                        </div>

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
                                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] rounded-xl p-4 border border-purple-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb size={14} className="text-yellow-400" />
                                        <span className="text-xs font-bold text-yellow-400 uppercase">Explanation</span>
                                    </div>
                                    <div className="text-gray-300 text-sm">
                                        <MiniMarkdown content={aiResponse.explanation} />
                                    </div>
                                </div>

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
                                                        const escapedCode = aiResponse.code
                                                            .replace(/\\/g, '\\\\')
                                                            .replace(/`/g, '\\`')
                                                            .replace(/\$/g, '\\$');

                                                        const script = `
                              (function() {
                                try {
                                  const monacoEditor = document.querySelector('.monaco-editor');
                                  if (monacoEditor && window.monaco) {
                                    const editor = monaco.editor.getModels()[0];
                                    if (editor) {
                                      editor.setValue(\`${escapedCode}\`);
                                      return 'Monaco: Code inserted successfully!';
                                    }
                                  }
                                  
                                  const codeMirror = document.querySelector('.CodeMirror');
                                  if (codeMirror && codeMirror.CodeMirror) {
                                    codeMirror.CodeMirror.setValue(\`${escapedCode}\`);
                                    return 'CodeMirror: Code inserted successfully!';
                                  }
                                  
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
                                onClick={handleAiSend}
                                disabled={isAiLoading}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    onMouseDown={() => setIsResizingVertical(true)}
                    className={`h-1.5 hover:h-2 bg-[#262626] hover:bg-cyan-500/50 cursor-row-resize z-10 transition-all ${isResizingVertical ? 'bg-cyan-500' : ''}`}
                />

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
                    </div>

                    <div className="p-4 border-t border-[#262626] bg-[#0a0a0a] shrink-0">
                        <button
                            onClick={handleSaveNotes}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all"
                        >
                            Save Results
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

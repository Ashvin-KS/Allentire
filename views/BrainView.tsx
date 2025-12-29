import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';

import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  MoreHorizontal,
  Sparkles,
  File,
  Send,
  FolderOpen,
  RefreshCw,
  FilePlus,
  Save,
  Edit3,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Quote,
  Square,
  Trash2
} from 'lucide-react';

// Default vault path - your Notes folder
const DEFAULT_VAULT = 'c:\\myself\\nonclgstuffs\\webdev\\all-in-one\\Notes';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

// Unified Styles Configuration
const MARKDOWN_STYLES = {
  h1: "text-3xl font-bold text-white mt-8 mb-4",
  h2: "text-2xl font-bold text-white mt-8 mb-4",
  h3: "text-xl font-semibold text-white mt-6 mb-3",
  h4: "text-lg font-semibold text-white mt-6 mb-2",
  h5: "text-base font-semibold text-white mt-4 mb-2",
  h6: "text-sm font-semibold text-gray-300 mt-4 mb-2",
  p: "text-gray-300 my-3 leading-relaxed",
  ul: "list-disc list-inside text-gray-300 my-3 space-y-1 ml-4",
  ol: "list-decimal list-inside text-gray-300 my-3 space-y-1 ml-4",
  li: "text-gray-300",
  codeInline: "bg-[#262626] px-1.5 py-0.5 rounded text-purple-300 text-sm font-mono",
  codeBlock: "bg-[#1a1a1a] p-4 rounded-lg overflow-x-auto text-sm my-4 border border-[#333] text-gray-300 font-mono",
  a: "text-blue-400 hover:underline cursor-pointer",
  blockquote: "border-l-4 border-purple-500 pl-4 text-gray-400 my-4 italic",
  hr: "border-[#333] my-6",
  img: "max-w-full rounded-lg my-4",
  table: "w-full border-collapse text-sm my-4",
  th: "text-left px-3 py-2 text-gray-200 font-semibold border-b border-[#333]",
  td: "px-3 py-2 text-gray-300 border-b border-[#262626]",
  tr: "hover:bg-[#1a1a1a]"
};

// Tiptap Editor Component
const TiptapEditor: React.FC<{
  content: string;
  onChange: (content: string) => void;
  onEditorCreate?: (editor: any) => void;
  onSelectionChange?: (text: string) => void;
}> = ({ content, onChange, onEditorCreate, onSelectionChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    onCreate: ({ editor }) => {
      onEditorCreate?.(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection;
      // Only update if we have a non-empty selection
      if (!empty) {
        const text = editor.state.doc.textBetween(from, to, '\n');
        onSelectionChange?.(text);
      }
    },
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
          HTMLAttributes: {
            class: (node) => MARKDOWN_STYLES[`h${node.level}` as keyof typeof MARKDOWN_STYLES] || '',
          }
        },
        paragraph: {
          HTMLAttributes: { class: MARKDOWN_STYLES.p },
        },
        bulletList: {
          HTMLAttributes: { class: MARKDOWN_STYLES.ul },
        },
        orderedList: {
          HTMLAttributes: { class: MARKDOWN_STYLES.ol },
        },
        listItem: {
          HTMLAttributes: { class: MARKDOWN_STYLES.li },
        },
        codeBlock: {
          HTMLAttributes: { class: MARKDOWN_STYLES.codeBlock },
        },
        blockquote: {
          HTMLAttributes: { class: MARKDOWN_STYLES.blockquote },
        },
        horizontalRule: {
          HTMLAttributes: { class: MARKDOWN_STYLES.hr },
        },
        bold: {
          HTMLAttributes: { class: "font-bold text-white" },
        },
        italic: {
          HTMLAttributes: { class: "italic text-gray-400" },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: MARKDOWN_STYLES.a },
      }),
      Image.configure({
        HTMLAttributes: { class: MARKDOWN_STYLES.img },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] py-4 px-8',
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any)?.markdown?.getMarkdown();
      if (markdown !== undefined) {
        onChange(markdown);
      }
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  // Update content if it changes externally
  useEffect(() => {
    if (!editor) return;

    const currentMarkdown = (editor.storage as any)?.markdown?.getMarkdown();
    if (currentMarkdown !== undefined) {
      const normalize = (str: string) => str.replace(/\r\n/g, '\n').trim();
      if (normalize(content) !== normalize(currentMarkdown)) {
        // We update even if focused to ensure AI edits show up
        // setContent(content, false) helps prevent some jumpiness
        (editor.commands as any).setContent(content, false);
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full w-full">

      {/* Main Toolbar - Always Visible */}
      <div className={`flex items-center gap-1 px-4 py-2 border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur sticky top-0 z-10 transition-opacity ${isFocused ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded hover:bg-[#262626] ${editor.isActive('heading', { level: 1 }) ? 'text-purple-400' : 'text-gray-500'}`} title="Heading 1">
          <Heading1 size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded hover:bg-[#262626] ${editor.isActive('heading', { level: 2 }) ? 'text-purple-400' : 'text-gray-500'}`} title="Heading 2">
          <Heading2 size={16} />
        </button>
        <div className="w-px h-4 bg-[#262626] mx-1" />
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-[#262626] ${editor.isActive('bold') ? 'text-purple-400' : 'text-gray-500'}`} title="Bold">
          <Bold size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-[#262626] ${editor.isActive('italic') ? 'text-purple-400' : 'text-gray-500'}`} title="Italic">
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-[#262626] mx-1" />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-[#262626] ${editor.isActive('bulletList') ? 'text-purple-400' : 'text-gray-500'}`} title="Bullet List">
          <List size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded hover:bg-[#262626] ${editor.isActive('orderedList') ? 'text-purple-400' : 'text-gray-500'}`} title="Numbered List">
          <ListOrdered size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-1.5 rounded hover:bg-[#262626] ${editor.isActive('taskList') ? 'text-purple-400' : 'text-gray-500'}`} title="Task List">
          <CheckSquare size={16} />
        </button>
        <div className="w-px h-4 bg-[#262626] mx-1" />
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded hover:bg-[#262626] ${editor.isActive('blockquote') ? 'text-purple-400' : 'text-gray-500'}`} title="Blockquote">
          <Quote size={16} />
        </button>
      </div>

      <EditorContent editor={editor} className="flex-1 w-full" />
    </div>
  );
};

export const BrainView: React.FC = () => {
  const [vaultPath, setVaultPath] = useState<string>(DEFAULT_VAULT);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [aiMessages, setAiMessages] = useState<{ sender: 'ai' | 'user', text: string, context?: string }[]>([
    { sender: 'ai', text: 'Welcome to Brain! Select a note from your vault or create a new one. I can help analyze and discuss your notes once you load them.' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string, name?: string }[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'lecture' | 'edit'>('lecture');
  const [proposedAction, setProposedAction] = useState<{
    type: 'insert' | 'create' | 'replace_selection' | 'insert_at_cursor' | 'find_and_replace';
    content?: string;
    target_text?: string;
    title?: string;
    message?: string;
    range?: { startLine: number, endLine: number };
  } | null>(null);

  const [selectedContext, setSelectedContext] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ startLine: number, endLine: number } | null>(null);
  const editorRef = useRef<any>(null); // Ref to hold Tiptap editor instance
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load chat history when file changes
  useEffect(() => {
    const chatKey = `brain_chat_${selectedFile || 'global'}`;
    const savedChat = localStorage.getItem(chatKey);
    if (savedChat) {
      try {
        setAiMessages(JSON.parse(savedChat));
      } catch (e) {
        setAiMessages([{ sender: 'ai', text: 'Welcome to Brain! Select a note from your vault or create a new one.' }]);
      }
    } else {
      setAiMessages([{ sender: 'ai', text: 'Welcome to Brain! Select a note from your vault or create a new one.' }]);
    }
  }, [selectedFile]);

  // Save chat history whenever it updates
  useEffect(() => {
    const chatKey = `brain_chat_${selectedFile || 'global'}`;
    localStorage.setItem(chatKey, JSON.stringify(aiMessages));
  }, [aiMessages, selectedFile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiSend();
    }
  };

  // Ref for the markdown view container
  const markdownContainerRef = useRef<HTMLDivElement>(null);

  // Handle Selection in View Mode using mouseup for reliability
  const handleMouseUp = () => {
    if (isEditing) return;

    // Small delay to ensure selection is finalized
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const text = selection.toString().trim();
      if (text.length > 0) {
        setSelectedContext(text);

        // Calculate Line Numbers using smarter line-based search
        // This handles markdown formatting (##, **, -, etc.) that isn't in rendered text
        const lines = fileContent.split('\n');
        const selectedLines = text.split('\n');
        const firstSelectedLine = selectedLines[0].trim();

        let startLine = -1;
        let endLine = -1;

        // Find the first line that contains the start of the selection
        for (let i = 0; i < lines.length; i++) {
          // Check if this line contains the first line of selection (ignoring markdown chars)
          const lineWithoutMarkdown = lines[i].replace(/^[#*\->\s]+/, '').trim();
          if (lineWithoutMarkdown.includes(firstSelectedLine) || lines[i].includes(firstSelectedLine)) {
            startLine = i + 1; // 1-indexed
            break;
          }
        }

        if (startLine !== -1) {
          // Estimate end line based on selection length
          endLine = startLine + selectedLines.length - 1;
          setSelectionRange({ startLine, endLine });
          console.log(`[Nexus View] Selected Lines: ${startLine}-${endLine}`);
        } else {
          console.warn('[Nexus View] Could not find selected text in raw content');
          setSelectionRange(null);
        }
      }
    }, 10);
  };


  // Sidebar Resizing
  const [aiPanelWidth, setAiPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = document.body.clientWidth - e.clientX;
      if (newWidth > 280 && newWidth < 800) { // Min 280px, Max 800px
        setAiPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch available models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://api.a4f.co/v1/models', {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_A4F_API_KEY}`
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error (${response.status}): ${errorText.slice(0, 100)}`);
        }

        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setAvailableModels(data.data);
          // Set default model to first one if not already set
          if (!selectedModel && data.data.length > 0) {
            setSelectedModel(data.data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // Fallback to a default
        setAvailableModels([{ id: 'gpt-4o-mini', name: 'GPT-4o Mini' }]);
        setSelectedModel('gpt-4o-mini');
      } finally {
        setModelsLoading(false);
      }
    };
    fetchModels();
  }, []);

  // Load file tree on mount
  useEffect(() => {
    loadFileTree();
  }, [vaultPath]);

  const loadFileTree = async () => {
    if (!window.nexusAPI?.notes) return;
    const tree = await window.nexusAPI.notes.getFileTree(vaultPath);
    setFileTree(tree);
  };

  const selectVault = async () => {
    if (!window.nexusAPI?.notes) {
      alert('Notes API not available. Make sure you are running in Electron.');
      return;
    }
    const path = await window.nexusAPI.notes.selectVault();
    if (path) {
      setVaultPath(path);
      localStorage.setItem('brain_vaultPath', path);
    }
  };

  const openFile = async (filePath: string) => {
    if (!window.nexusAPI?.notes) return;
    const content = await window.nexusAPI.notes.readFile(filePath);
    if (content !== null) {
      setSelectedFile(filePath);
      setFileContent(content);
      setEditContent(content);
      setIsEditing(false);

      // Build breadcrumbs
      const relativePath = filePath.replace(vaultPath, '').replace(/^[/\\]/, '');
      const parts = relativePath.split(/[/\\]/);
      setBreadcrumbs(parts);
    }
  };

  const saveFile = async () => {
    if (!selectedFile || !window.nexusAPI?.notes) return;
    const success = await window.nexusAPI.notes.writeFile(selectedFile, editContent);
    if (success) {
      setFileContent(editContent);
      setIsEditing(false);
    }
  };

  const createNewFile = async () => {
    if (!newFileName.trim() || !window.nexusAPI?.notes) return;
    const result = await window.nexusAPI.notes.createFile(vaultPath, newFileName);
    if (result.success && result.path) {
      setShowNewFileInput(false);
      setNewFileName('');
      await loadFileTree();
      openFile(result.path);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const createNewFolder = async () => {
    if (!newFolderName.trim() || !window.nexusAPI?.notes) return;
    const result = await window.nexusAPI.notes.createFolder(vaultPath, newFolderName);
    if (result.success) {
      setShowNewFolderInput(false);
      setNewFolderName('');
      await loadFileTree();
    }
  };

  const handleFileDrop = async (sourcePath: string, targetPath: string) => {
    if (!window.nexusAPI?.notes) return;

    // Check if target is a folder (it should be, based on logic in item component, but double check)
    // Actually, we pass targetPath as the folder path directly from the item component
    console.log(`Moving ${sourcePath} to ${targetPath}`);

    const result = await window.nexusAPI.notes.moveFile(sourcePath, targetPath);
    if (result.success) {
      await loadFileTree(); // Refresh tree
    } else {
      console.error('Move failed:', result.error);
      // Optional: Show toast error
    }
  };

  const handleRename = async (oldPath: string, newName: string) => {
    if (!window.nexusAPI?.notes) return;
    const result = await window.nexusAPI.notes.rename(oldPath, newName);
    if (result.success) {
      await loadFileTree();
      // If the renamed file was selected, update selection
      if (selectedFile === oldPath && result.newPath) {
        openFile(result.newPath);
      }
    } else {
      console.error('Rename failed:', result.error);
    }
  };

  const handleStopAi = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsAiLoading(false);
      setAiMessages(prev => [...prev, { sender: 'ai', text: '🛑 Response interrupted by user.' }]);
    }
  };

  const clearChat = () => {
    setAiMessages([{ sender: 'ai', text: 'Chat cleared. How can I help you with this note?' }]);
    // Clear persistence immediately
    const chatKey = `brain_chat_${selectedFile || 'global'}`;
    localStorage.removeItem(chatKey);
  };

  const handleAiSend = async () => {
    if (!aiInput.trim() || isAiLoading) return;

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const userMessage = aiInput.trim();
    const usedContext = selectedContext; // Capture before clearing
    const usedRange = selectionRange;

    // Add user message WITH the context attached
    setAiMessages(prev => [...prev, { sender: 'user', text: userMessage, context: usedContext || undefined }]);
    setAiInput('');
    setSelectedContext(''); // Clear context after attaching to message
    setSelectionRange(null);
    setIsAiLoading(true);
    setProposedAction(null);

    try {
      // Build context from current note
      // Enhanced Context Logic
      let contextContent = fileContent;
      let selectionContext = '';
      let isSelectionActive = false;

      if (usedContext) {
        isSelectionActive = true;
        selectionContext = `\n\n::: USER HAS SELECTED THIS TEXT :::\n"""\n${usedContext}\n"""\n`;
        if (usedRange) {
          selectionContext += `(Located roughly at Lines ${usedRange.startLine} to ${usedRange.endLine})`;
        }
        selectionContext += `\n(Focus your response on processing/replacing this selection)\n\n`;
      }

      // Truncate logic (simple for now, ideally we want smart truncation around cursor)
      const MAX_CHARS = 10000;
      const truncatedContent = contextContent.length > MAX_CHARS
        ? contextContent.slice(0, MAX_CHARS) + "\n...(truncated)..."
        : contextContent;

      const noteContext = selectedFile
        ? `Current note: ${selectedFile.split(/[/\\]/).pop()}\n\n${selectionContext}Content:\n${truncatedContent}`
        : 'No note currently open.';

      const systemPrompt = `You are Nexus AI, a helpful assistant integrated into a note-taking app. You have full access to the user's notes and the custom markdown editor.

${aiMode === 'edit' ?
          `You are in EDIT MODE. Your goal is to help the user write, edit, and organize their note.
You must output a JSON object at the end of your response to perform an action.

AVAILABLE ACTIONS:

1. REPLACE SELECTION (Use when user highlights text):
\`\`\`json
{
  "action": "replace_selection",
  "content": "new text to replace the selection",
  "explanation": "brief reason"
}
\`\`\`

2. INSERT AT CURSOR (Use when user asks to add something at their position):
\`\`\`json
{
  "action": "insert_at_cursor",
  "content": "text to insert",
  "explanation": "brief reason"
}
\`\`\`

3. FIND AND REPLACE (Use when asking to change specific text without selection):
\`\`\`json
{
  "action": "find_and_replace",
  "target_text": "text to find (must be exact match)",
  "content": "replacement text",
  "explanation": "brief reason"
}
\`\`\`

4. CREATE NEW NOTE:
\`\`\`json
{
  "action": "create_note",
  "title": "New Note Title",
  "content": "Initial content",
  "explanation": "brief reason"
}
\`\`\`

5. APPEND (Legacy/Fallback - adds to end):
\`\`\`json
{
  "action": "insert_content",
  "content": "text to append",
  "explanation": "brief reason"
}
\`\`\`

${isSelectionActive ? `**CRITICAL: The user has SELECTED text. You MUST use "find_and_replace" to modify this.
IMPORTANT: The user selected text from the RENDERED view. You must locate the corresponding EXACT RAW MARKDOWN in the "Content" provided above.
Example: User selects "Heading", but raw content is "## Heading". You must set "target_text" to "## Heading".
Example: User selects a list item. You must include the dash "-" or number if you intend to remove the list item structure.**` : "No text selected. Use find_and_replace if editing existing text, or insert_content to add new content."}
`
          :
          `You are in LECTURE MODE. Focus on explaining, summarizing, and analyzing the notes. You are a teacher.`
        }

Here is the context:
${noteContext}`;

      const response = await fetch('https://api.a4f.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_A4F_API_KEY}`
        },
        body: JSON.stringify({
          model: selectedModel || 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...aiMessages.map(m => ({ role: m.sender === 'ai' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: userMessage }
          ],
          stream: false
        }),
        signal: abortControllerRef.current?.signal // Add abort signal
      });

      if (!response.ok) {
        throw new Error(`API error (${response.status})`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      setAiMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);

      if (aiMode === 'edit') {
        // Robust JSON extraction: look for json code blocks first, then try raw brace matching if that fails
        const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
        let match = jsonBlockRegex.exec(aiResponse);
        let jsonString = match ? match[1] : null;

        // Fallback: try to find the last { ... } block
        if (!jsonString) {
          const braceMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (braceMatch) jsonString = braceMatch[0];
        }

        if (jsonString) {
          try {
            const actionData = JSON.parse(jsonString);
            console.log('[Nexus AI] Parsed action:', actionData.action, 'usedContext:', usedContext?.slice(0, 50));
            if (['insert_content', 'create_note', 'replace_selection', 'insert_at_cursor', 'find_and_replace'].includes(actionData.action)) {
              setProposedAction({
                type: actionData.action === 'insert_content' ? 'insert' : actionData.action,
                content: actionData.content,
                target_text: actionData.target_text,
                title: actionData.title,
                message: actionData.explanation,
                range: usedRange || undefined // Pass previous selection range for scoped replacement
              });
            }
          } catch (e) {
            console.error('Failed to parse AI action JSON:', e);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return; // Handled by handleStopAi
      }
      console.error('AI API error:', error);
      setAiMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Sorry, there was an error connecting to the AI.'
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAction = async () => {
    if (!proposedAction || !window.nexusAPI?.notes) return;

    try {
      if (proposedAction.type === 'create') {
        // ... existing create logic ...
        if (proposedAction.title) {
          const result = await window.nexusAPI.notes.createFile(vaultPath, proposedAction.title);
          if (result.success && result.path) {
            await window.nexusAPI.notes.writeFile(result.path, proposedAction.content || '');
            await loadFileTree();
            openFile(result.path);
            setAiMessages(prev => [...prev, { sender: 'ai', text: `✅ Created new note: ${proposedAction.title}` }]);
          }
        }
      } else {
        // EDIT ACTIONS
        // We need to apply these changes to the File System AND the Editor state.
        // Best approach: Update FS, then duplicate update to Editor to avoid reload.

        let newContent = isEditing ? editContent : fileContent;
        let successMessage = 'Action applied.';

        console.log('[Nexus Apply] Action type:', proposedAction.type);
        console.log('[Nexus Apply] Target text:', proposedAction.target_text?.slice(0, 100));
        console.log('[Nexus Apply] Replacement content:', proposedAction.content?.slice(0, 100));
        console.log('[Nexus Apply] Range:', proposedAction.range);

        if ((proposedAction.type === 'replace_selection' || proposedAction.type === 'find_and_replace') && proposedAction.target_text) {
          const escapedTarget = proposedAction.target_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedTarget, 'g');

          // SCOPED REPLACEMENT (if range exists)
          if (proposedAction.range) {
            const lines = newContent.split('\n');
            const { startLine, endLine } = proposedAction.range;

            const startIdx = Math.max(0, startLine - 1);
            const endIdx = Math.min(lines.length, endLine);

            const beforeChunk = lines.slice(0, startIdx).join('\n');
            let targetChunk = lines.slice(startIdx, endIdx).join('\n');
            const afterChunk = lines.slice(endIdx).join('\n');

            targetChunk = targetChunk.replace(regex, proposedAction.content || '');

            newContent = [beforeChunk, targetChunk, afterChunk].filter(x => x !== undefined).join('\n');
          } else {
            newContent = newContent.replace(regex, proposedAction.content || '');
          }

          if (isEditing && editorRef.current) {
            (editorRef.current.commands as any).setContent(newContent, true);
          }
          successMessage = '✅ Text updated successfully.';
        }
        else if (proposedAction.type === 'insert_at_cursor') {
          // Append at end (view mode) or insert at cursor (edit mode)
          if (isEditing && editorRef.current) {
            editorRef.current.commands.insertContent(proposedAction.content);
            newContent = editorRef.current.storage.markdown.getMarkdown();
          } else {
            newContent = newContent.trim() + '\n\n' + (proposedAction.content || '').trim();
          }
          successMessage = '✅ Content inserted.';
        }
        else if (proposedAction.type === 'insert') {
          // Fallback append
          newContent = newContent.trim() + '\n\n' + (proposedAction.content || '').trim();
          if (isEditing && editorRef.current) {
            (editorRef.current.commands as any).setContent(newContent, true);
          }
          successMessage = '✅ Content appended.';
        }
        else {
          successMessage = '⚠️ Could not apply action - missing information.';
        }

        // Save to Disk
        if (selectedFile) {
          const success = await window.nexusAPI.notes.writeFile(selectedFile, newContent);

          if (success) {
            setFileContent(newContent);
            setEditContent(newContent);
            setAiMessages(prev => [...prev, { sender: 'ai', text: successMessage }]);
          } else {
            setAiMessages(prev => [...prev, { sender: 'ai', text: '❌ Failed to save changes to file.' }]);
          }
        } else {
          console.error('[Nexus Apply] No selectedFile!');
        }
      }
    } catch (err) {
      console.error('Error applying AI action:', err);
    } finally {
      setProposedAction(null);
    }
  };
  // Sidebar States
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

  return (
    <div className="flex h-full w-full bg-[#0a0a0a] text-white overflow-hidden rounded-xl border border-[#262626] animate-in fade-in duration-300 relative">

      {/* LEFT COLUMN: FILE EXPLORER */}
      {isExplorerOpen && (
        <div className="w-64 bg-[#161616] border-r border-[#262626] flex flex-col shrink-0 animate-in slide-in-from-left-10 duration-200">
          <div className="h-12 flex items-center justify-between px-4 border-b border-[#262626]">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Explorer</span>
            <div className="flex gap-1">
              <button onClick={() => setIsExplorerOpen(false)} className="p-1 hover:bg-[#262626] rounded text-gray-500 hover:text-white" title="Close Explorer">
                <PanelLeftClose size={14} />
              </button>
            </div>
          </div>


          {showNewFileInput && (
            <div className="p-2 border-b border-[#262626]">
              <input
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createNewFile();
                  if (e.key === 'Escape') setShowNewFileInput(false);
                }}
                placeholder="New note name..."
                className="w-full px-2 py-1 bg-[#262626] border border-[#333] rounded text-sm text-white outline-none focus:border-purple-500"
              />
            </div>
          )}

          {showNewFolderInput && (
            <div className="p-2 border-b border-[#262626]">
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createNewFolder();
                  if (e.key === 'Escape') setShowNewFolderInput(false);
                }}
                placeholder="New folder name..."
                className="w-full px-2 py-1 bg-[#262626] border border-[#333] rounded text-sm text-white outline-none focus:border-yellow-500"
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5 custom-scrollbar">
            {fileTree.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                {window.nexusAPI?.notes ? 'Loading...' : 'Run in Electron to access files'}
              </div>
            ) : (
              fileTree.map(node => (
                <FileTreeItemReal
                  key={node.path}
                  node={node}
                  depth={0}
                  selectedPath={selectedFile}
                  onSelect={openFile}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  onDrop={handleFileDrop}
                  onRename={handleRename}
                />
              ))
            )}
          </div>

          <div className="flex items-center gap-1 p-2 border-t border-[#262626]">
            <button onClick={loadFileTree} className="p-1.5 hover:bg-[#262626] rounded text-gray-500 hover:text-white" title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => { setShowNewFileInput(true); setShowNewFolderInput(false); }} className="p-1.5 hover:bg-[#262626] rounded text-gray-500 hover:text-white" title="New Note">
              <FilePlus size={14} />
            </button>
            <button onClick={() => { setShowNewFolderInput(true); setShowNewFileInput(false); }} className="p-1.5 hover:bg-[#262626] rounded text-gray-500 hover:text-white" title="New Folder">
              <FolderOpen size={14} />
            </button>
            <button
              onClick={selectVault}
              className="flex-1 ml-1 px-2 py-1.5 bg-[#262626] border border-[#333] rounded text-xs text-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              Change Vault
            </button>
          </div>
        </div>
      )}

      {/* CENTER COLUMN: EDITOR */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a] relative min-w-0">
        {/* Header / Breadcrumbs */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-[#262626]">
          <div className="flex items-center gap-3 overflow-hidden">
            {!isExplorerOpen && (
              <button onClick={() => setIsExplorerOpen(true)} className="p-1 hover:bg-[#262626] rounded text-gray-500 hover:text-white" title="Open Explorer">
                <PanelLeftOpen size={16} />
              </button>
            )}

            <div className="flex items-center text-sm text-gray-500 select-none overflow-hidden text-ellipsis whitespace-nowrap">
              {breadcrumbs.length > 0 ? (
                breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ChevronRight size={14} className="mx-2 opacity-50 shrink-0" />}
                    <span className={`truncate ${i === breadcrumbs.length - 1 ? 'text-gray-300' : 'hover:text-gray-300 cursor-pointer transition-colors'}`}>
                      {crumb.replace('.md', '')}
                    </span>
                  </React.Fragment>
                ))
              ) : (
                <span className="text-gray-600">No note selected</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedFile && (
              <>
                {isEditing ? (
                  <>
                    <button onClick={saveFile} className="flex items-center gap-1 px-3 py-1 bg-green-600 rounded text-xs text-white hover:bg-green-500">
                      <Save size={12} /> <span className="hidden sm:inline">Save</span>
                    </button>
                    <button onClick={() => { setIsEditing(false); setEditContent(fileContent); }} className="flex items-center gap-1 px-3 py-1 bg-[#262626] rounded text-xs text-gray-300 hover:bg-[#333]">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1 bg-[#262626] rounded text-xs text-gray-300 hover:bg-[#333]">
                    <Edit3 size={12} /> <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
              </>
            )}

            {!isAiPanelOpen && (
              <button onClick={() => setIsAiPanelOpen(true)} className="p-1 hover:bg-[#262626] rounded text-gray-500 hover:text-white ml-2" title="Open AI">
                <PanelRightOpen size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
          {selectedFile ? (
            <div className="w-full h-full">
              {isEditing ? (
                <TiptapEditor
                  content={editContent}
                  onChange={(val) => setEditContent(val)}
                  onEditorCreate={(editor) => { editorRef.current = editor; }}
                  onSelectionChange={setSelectedContext}
                />
              ) : (
                <div
                  ref={markdownContainerRef}
                  onMouseUp={handleMouseUp}
                  className="prose prose-invert max-w-none w-full px-4 sm:px-8 pb-8 pt-4 cursor-auto select-text"
                >
                  <MarkdownRenderer content={fileContent} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FileText size={48} className="mb-4 opacity-30" />
              <p>Select a note to view</p>
            </div>
          )}
        </div>
      </div>

      {/* DRAG HANDLE */}
      {isAiPanelOpen && (
        <div
          onMouseDown={startResizing}
          className={`w-1 hover:w-1 bg-[#262626] hover:bg-purple-500/50 cursor-col-resize z-50 transition-colors ${isResizing ? 'bg-purple-500' : ''}`}
        />
      )}

      {/* RIGHT COLUMN: NEXUS AI */}
      {isAiPanelOpen && (
        <div
          ref={sidebarRef}
          style={{ width: aiPanelWidth }}
          className="bg-[#161616] border-l border-[#262626] flex flex-col shrink-0 animate-in slide-in-from-right-10 duration-200"
        >
          <div className="h-12 flex items-center justify-between px-5 border-b border-[#262626]">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400 fill-purple-400/20" />
              <span className="font-semibold text-sm tracking-wide text-gray-200">Nexus AI</span>
            </div>
            <button onClick={() => setIsAiPanelOpen(false)} className="text-gray-500 cursor-pointer hover:text-white transition-colors">
              <PanelRightClose size={14} />
            </button>
          </div>

          {/* AI Header Actions - Clear Chat */}
          <div className="px-5 pt-3 pb-0 flex justify-end">
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-500 hover:text-red-400 transition-colors"
              title="Clear current chat history"
            >
              <Trash2 size={12} /> Clear Chat
            </button>
          </div>

          <div className="flex-1 flex flex-col p-5 overflow-hidden">
            {/* Mode Toggle */}
            <div className="mb-4">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">AI Mode</h4>
              <div className="flex p-1 bg-[#0a0a0a] rounded-lg border border-[#262626]">
                <button
                  onClick={() => setAiMode('lecture')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${aiMode === 'lecture' ? 'bg-[#262626] text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <FileText size={14} />
                  Lecture
                </button>
                <button
                  onClick={() => setAiMode('edit')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${aiMode === 'edit' ? 'bg-[#262626] text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="mb-4 relative">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Model</h4>
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#262626] border border-[#333] rounded text-sm text-gray-300 hover:border-purple-500/40 transition-colors"
              >
                <span className="truncate">{selectedModel || 'Select model...'}</span>
                <ChevronDown size={14} className={`transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showModelDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {modelsLoading ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Loading models...</div>
                  ) : (
                    availableModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => { setSelectedModel(model.id); setShowModelDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[#262626] transition-colors ${selectedModel === model.id ? 'bg-purple-900/30 text-purple-300' : 'text-gray-300'}`}
                      >
                        {model.name || model.id}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Current Note Context */}
            {selectedFile && (
              <div className="mb-4">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Current Context</h4>
                <div className="flex items-center gap-2 bg-[#262626]/50 border border-[#333] rounded px-2 py-1.5">
                  <FileText size={12} className="text-cyan-400" />
                  <span className="text-xs text-gray-300 truncate">{selectedFile.split(/[/\\]/).pop()}</span>
                </div>
              </div>
            )}

            <div className="w-full h-px bg-[#262626] mb-4"></div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-1 custom-scrollbar">
              {aiMessages.map((msg, i) => (
                <ChatBubble key={i} sender={msg.sender} text={msg.text} context={msg.context} />
              ))}
              {isAiLoading && (
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/10 text-gray-400 rounded-2xl rounded-tl-sm border border-purple-500/10 px-3 py-2 text-sm">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Confirmation Overlay */}
          {proposedAction && (
            <div className="px-5 pb-4 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2 text-purple-300">
                  <Sparkles size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Proposal</span>
                </div>
                <p className="text-sm text-gray-200 mb-3">{proposedAction.message || "Confirm this action?"}</p>
                <div className="bg-[#0a0a0a]/50 rounded p-2 mb-4 max-h-32 overflow-y-auto border border-white/5">
                  <div className="text-[10px] text-gray-400 font-mono mb-1 uppercase tracking-wider">{proposedAction.type.replace(/_/g, ' ')}</div>
                  {proposedAction.target_text && (
                    <div className="mb-2 border-b border-white/5 pb-2">
                      <span className="text-red-400 line-through mr-2">{proposedAction.target_text}</span>
                    </div>
                  )}
                  <pre className="text-[10px] text-green-400 whitespace-pre-wrap font-mono relative">
                    {proposedAction.content}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyAction}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded transition-colors shadow-md"
                  >
                    Confirm & Apply
                  </button>
                  <button
                    onClick={() => setProposedAction(null)}
                    className="px-3 bg-[#262626] hover:bg-[#333] text-gray-300 text-xs font-bold py-2 rounded transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Context Chip */}
          {selectedContext && (
            <div className="mx-4 mt-2 p-2 bg-[#262626] border border-purple-500/30 rounded-lg flex items-start gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
              <div className="mt-0.5 text-purple-400">
                <Sparkles size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">Using Context</div>
                <div className="text-xs text-gray-300 line-clamp-2 font-mono border-l-2 border-purple-500/50 pl-2">
                  {selectedContext}
                </div>
              </div>
              <button
                onClick={() => { setSelectedContext(''); window.getSelection()?.removeAllRanges(); }}
                className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
              >
                <PanelLeftClose size={14} className="rotate-45" /> {/* Using as X icon */}
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-[#161616]">
            <div className="relative bg-[#0a0a0a] border border-[#262626] rounded-xl focus-within:border-purple-500/50 transition-colors">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask Nexus about ${selectedFile ? 'this note' : 'your notes'}...`}
                className="w-full bg-transparent border-none text-sm text-gray-200 p-3 pr-12 outline-none resize-none h-12 min-h-[48px] max-h-32 custom-scrollbar"
                style={{ height: '48px' }} // Dynamic height handling typically needs a ref/effect
              />
              <button
                onClick={isAiLoading ? handleStopAi : handleAiSend}
                disabled={!isAiLoading && !aiInput.trim()}
                className={`absolute right-2 top-2 p-2 rounded-lg text-white transition-all shadow-lg shadow-purple-900/20 ${isAiLoading ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                title={isAiLoading ? "Stop generation" : "Send message"}
              >
                {isAiLoading ? <Square size={16} fill="currentColor" /> : <Send size={16} />}
              </button>
            </div>
            <div className="mt-2 text-[10px] text-center text-gray-600">
              Nexus AI can make mistakes. Review generated actions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Real File Tree Item Component
interface FileTreeItemRealProps {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  onDrop: (sourcePath: string, targetPath: string) => void;
  onRename: (oldPath: string, newName: string) => void;
}

const FileTreeItemReal: React.FC<FileTreeItemRealProps> = ({
  node, depth, selectedPath, onSelect, expandedFolders, toggleFolder, onDrop, onRename
}) => {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;
  const [isDragOver, setIsDragOver] = useState(false);

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('sourcePath', node.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.isDirectory) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const sourcePath = e.dataTransfer.getData('sourcePath');
    if (sourcePath && node.isDirectory) {
      onDrop(sourcePath, node.path);
    }
  };

  const submitRename = () => {
    const newName = renameValue.trim();
    if (newName && newName !== node.name) {
      onRename(node.path, newName);
    }
    setIsRenaming(false);
  };

  return (
    <div>
      <div
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isRenaming) {
            node.isDirectory ? toggleFolder(node.path) : onSelect(node.path);
          }
        }}
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer select-none text-sm transition-colors group relative pr-8
          ${isSelected ? 'bg-[#262626] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#262626]/50'}
          ${isDragOver ? 'bg-purple-900/30 ring-1 ring-purple-500' : ''}
        `}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <span className="opacity-70 group-hover:opacity-100">
          {node.isDirectory ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-3.5" />
          )}
        </span>

        {node.isDirectory ? (
          isExpanded ? <FolderOpen size={14} className="text-yellow-500" /> : <Folder size={14} className="text-yellow-600" />
        ) : (
          <FileText size={14} className={isSelected ? 'text-cyan-400' : 'text-gray-400 group-hover:text-gray-200'} />
        )}

        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            onBlur={submitRename}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-[#0a0a0a] border border-blue-500 rounded px-1 -ml-1 text-white outline-none"
          />
        ) : (
          <span className="truncate">{node.name.replace('.md', '')}</span>
        )}

        {/* Rename Button (Visible on Hover) */}
        {!isRenaming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
              setRenameValue(node.name);
            }}
            className="absolute right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-500 hover:text-white transition-all"
            title="Rename"
          >
            <Edit3 size={12} />
          </button>
        )}
      </div>

      {node.isDirectory && isExpanded && node.children && (
        <div className="flex flex-col gap-0.5">
          {node.children.map(child => (
            <FileTreeItemReal
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onDrop={onDrop}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Markdown Renderer using react-markdown
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children }) => <h1 className={MARKDOWN_STYLES.h1}>{children}</h1>,
        h2: ({ children }) => <h2 className={MARKDOWN_STYLES.h2}>{children}</h2>,
        h3: ({ children }) => <h3 className={MARKDOWN_STYLES.h3}>{children}</h3>,
        h4: ({ children }) => <h4 className={MARKDOWN_STYLES.h4}>{children}</h4>,
        h5: ({ children }) => <h5 className={MARKDOWN_STYLES.h5}>{children}</h5>,
        h6: ({ children }) => <h6 className={MARKDOWN_STYLES.h6}>{children}</h6>,

        // Paragraphs
        p: ({ children }) => <p className={MARKDOWN_STYLES.p}>{children}</p>,

        // Lists
        ul: ({ children }) => <ul className={MARKDOWN_STYLES.ul}>{children}</ul>,
        ol: ({ children }) => <ol className={MARKDOWN_STYLES.ol}>{children}</ol>,
        li: ({ children }) => <li className={MARKDOWN_STYLES.li}>{children}</li>,

        // Code
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return <code className={MARKDOWN_STYLES.codeInline}>{children}</code>;
          }
          return (
            <code className={`${className} text-gray-300`} {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className={MARKDOWN_STYLES.codeBlock}>
            {children}
          </pre>
        ),

        // Links
        a: ({ href, children }) => (
          <a href={href} className={MARKDOWN_STYLES.a} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className={MARKDOWN_STYLES.blockquote}>
            {children}
          </blockquote>
        ),

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className={MARKDOWN_STYLES.table}>{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-[#1a1a1a]">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className={MARKDOWN_STYLES.tr}>{children}</tr>,
        th: ({ children }) => <th className={MARKDOWN_STYLES.th}>{children}</th>,
        td: ({ children }) => <td className={MARKDOWN_STYLES.td}>{children}</td>,

        // Horizontal rule
        hr: () => <hr className={MARKDOWN_STYLES.hr} />,

        // Bold & Italic
        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-gray-400">{children}</em>,

        // Images
        img: ({ src, alt }) => (
          <img src={src} alt={alt || ''} className={MARKDOWN_STYLES.img} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const ChatBubble: React.FC<{ sender: 'ai' | 'user'; text: string; context?: string }> = ({ sender, text, context }) => {
  const [isThinkExpanded, setIsThinkExpanded] = React.useState(false);

  // Parse for <think> tags
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
  const thinkContent = thinkMatch ? thinkMatch[1] : null;
  const cleanText = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();

  return (
    <div className={`flex flex-col ${sender === 'user' ? 'items-end' : 'items-start'} max-w-[95%]`}>

      {/* Context Badge for User Messages */}
      {sender === 'user' && context && (
        <div className="mb-1 flex items-center gap-1.5 text-[10px] text-purple-400 bg-purple-900/20 border border-purple-500/30 rounded px-2 py-1">
          <Sparkles size={10} />
          <span className="font-mono line-clamp-1 max-w-[200px]">{context}</span>
        </div>
      )}

      {/* Thinking Process (Collapsible) */}
      {thinkContent && (
        <div className="w-full mb-2">
          <button
            onClick={() => setIsThinkExpanded(!isThinkExpanded)}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-1"
          >
            <ChevronRight size={12} className={`transition-transform duration-200 ${isThinkExpanded ? 'rotate-90' : ''}`} />
            <span className="font-mono">Thinking Process</span>
          </button>

          {isThinkExpanded && (
            <div className="text-xs text-gray-400 bg-[#1a1a1a] border-l-2 border-gray-700 pl-3 py-2 my-1 italic font-mono whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-2 duration-200">
              {thinkContent.trim()}
            </div>
          )}
        </div>
      )}

      {/* Main Message */}
      <div className={`
        rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
        ${sender === 'user'
          ? 'bg-[#262626] text-gray-200 rounded-tr-sm border border-[#333]'
          : 'bg-gradient-to-br from-purple-900/20 to-blue-900/10 text-gray-300 rounded-tl-sm border border-purple-500/10'}
      `}>
        {cleanText || (thinkContent ? <span className="italic text-gray-500">Thinking complete.</span> : text)}
      </div>

      <span className="text-[10px] text-gray-600 mt-1 px-1 select-none">
        {sender === 'ai' ? 'Nexus' : 'You'}
      </span>
    </div>
  );
};
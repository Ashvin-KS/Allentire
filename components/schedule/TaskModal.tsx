import React, { useState, useEffect } from 'react';
import { X, Calendar, AlignLeft } from 'lucide-react';
import { Task } from '../../store/useScheduleStore';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id'>) => void;
    onDelete?: () => void;
    initialData?: Task;
}

const tags = ['Work', 'Health', 'Study', 'Life'] as const;
const colors = ['blue', 'orange', 'emerald', 'gray'] as const;

const tagToColor: Record<typeof tags[number], typeof colors[number]> = {
    Work: 'blue',
    Health: 'orange',
    Study: 'emerald',
    Life: 'gray',
};

export const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [tag, setTag] = useState<Task['tag']>('Work');
    const [color, setColor] = useState<Task['color']>('blue');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setDueDate(initialData.dueDate || '');
            setTag(initialData.tag);
            setColor(initialData.color);
        } else {
            setTitle('');
            setDescription('');
            setDueDate('');
            setTag('Work');
            setColor('blue');
        }
    }, [initialData, isOpen]);

    // Auto-assign color based on tag selection
    const handleTagChange = (newTag: Task['tag']) => {
        setTag(newTag);
        setColor(tagToColor[newTag]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({
            title: title.trim(),
            description: description.trim() || undefined,
            dueDate: dueDate || undefined,
            tag,
            color
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#161616] border border-[#333] rounded-xl w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
                    <h3 className="text-lg font-semibold text-white">
                        {initialData ? 'Edit Task' : 'New Task'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-[#262626] rounded-md text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                            Task Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What do you need to do?"
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                            <Calendar size={12} />
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all [color-scheme:dark]"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                            <AlignLeft size={12} />
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details..."
                            rows={3}
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none"
                        />
                    </div>

                    {/* Tag */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                            Category
                        </label>
                        <div className="flex gap-2">
                            {tags.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleTagChange(t)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tag === t
                                        ? t === 'Work' ? 'bg-blue-500/20 border-blue-500 text-blue-400 border' :
                                            t === 'Health' ? 'bg-orange-500/20 border-orange-500 text-orange-400 border' :
                                                t === 'Study' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 border' :
                                                    'bg-gray-500/20 border-gray-500 text-gray-400 border'
                                        : 'bg-[#202020] border border-[#333] text-gray-500 hover:bg-[#262626] hover:text-gray-300'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete();
                                    onClose();
                                }}
                                className="px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
                            >
                                Delete
                            </button>
                        )}
                        <div className="flex-1" />
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-[#202020] border border-[#333] text-gray-400 rounded-lg hover:bg-[#262626] transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="px-5 py-2.5 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {initialData ? 'Save Changes' : 'Add Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

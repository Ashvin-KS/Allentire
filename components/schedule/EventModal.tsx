import React, { useState, useEffect } from 'react';
import { X, Clock, Timer, Tag, RefreshCw } from 'lucide-react';
import { ScheduleEvent } from '../../store/useScheduleStore';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<ScheduleEvent, 'id'>, syncToGoogle: boolean) => void;
    onDelete?: (syncToGoogle: boolean) => void;
    initialData?: ScheduleEvent;
    initialTime?: string;
    isGoogleConnected: boolean; // Pass this in
}

const eventTypes = ['focus', 'break', 'meeting', 'work'] as const;

const typeLabels: Record<typeof eventTypes[number], string> = {
    focus: '🎯 Focus',
    break: '☕ Break',
    meeting: '👥 Meeting',
    work: '💼 Work',
};

const typeStyles: Record<typeof eventTypes[number], string> = {
    focus: 'bg-cyan-500/20 border-cyan-500 text-cyan-400',
    break: 'bg-gray-500/20 border-gray-500 text-gray-400',
    meeting: 'bg-purple-500/20 border-purple-500 text-purple-400',
    work: 'bg-blue-500/20 border-blue-500 text-blue-400',
};

const durations = [15, 30, 45, 60, 90, 120, 180];

export const EventModal: React.FC<EventModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    initialTime,
    isGoogleConnected
}) => {
    const [title, setTitle] = useState('');
    const [timeStart, setTimeStart] = useState('09:00');
    const [duration, setDuration] = useState(60);
    const [type, setType] = useState<ScheduleEvent['type']>('work');
    const [syncToGoogle, setSyncToGoogle] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setTimeStart(initialData.timeStart);
            setDuration(initialData.duration);
            setType(initialData.type);
            setSyncToGoogle(!!initialData.googleId); // If it has a google ID, default to sync
        } else {
            setTitle('');
            setTimeStart(initialTime || '09:00');
            setDuration(60);
            setType('work');
            setSyncToGoogle(isGoogleConnected); // Default to true if connected
        }
    }, [initialData, initialTime, isOpen, isGoogleConnected]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({
            title: title.trim(),
            timeStart,
            duration,
            type,
            date: initialData?.date || new Date().toISOString().split('T')[0]
        }, syncToGoogle);
        onClose();
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(syncToGoogle);
            onClose();
        }
    }

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
                        {initialData ? 'Edit Event' : 'New Event'}
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
                            Event Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's happening?"
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Time & Duration Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Time Start */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                                <Clock size={12} />
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={timeStart}
                                onChange={(e) => setTimeStart(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all [color-scheme:dark]"
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                                <Timer size={12} />
                                Duration
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all appearance-none cursor-pointer"
                            >
                                {durations.map((d) => (
                                    <option key={d} value={d}>
                                        {formatDuration(d)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Event Type */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                            <Tag size={12} />
                            Event Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {eventTypes.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${type === t
                                        ? typeStyles[t]
                                        : 'bg-[#202020] border-[#333] text-gray-500 hover:bg-[#262626] hover:text-gray-300'
                                        }`}
                                >
                                    {typeLabels[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sync Checkbox */}
                    {isGoogleConnected && (
                        <div
                            onClick={() => setSyncToGoogle(!syncToGoogle)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${syncToGoogle
                                ? 'bg-blue-500/10 border-blue-500/30'
                                : 'bg-[#0a0a0a] border-[#333] hover:border-gray-500'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${syncToGoogle ? 'bg-blue-500 border-blue-500 text-black' : 'border-gray-500 text-transparent'
                                }`}>
                                <RefreshCw size={12} />
                            </div>
                            <div className="flex-1">
                                <span className={`text-sm font-medium ${syncToGoogle ? 'text-blue-200' : 'text-gray-400'}`}>
                                    Sync with Google Calendar
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={handleDelete}
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
                            {initialData ? 'Save Changes' : 'Add Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

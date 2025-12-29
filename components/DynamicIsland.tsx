import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music, ChevronDown, Timer as TimerIcon, X } from 'lucide-react';
import { useTimerStore, formatTime } from '../store/useTimerStore';
import { useMusicStore, Track } from '../store/useMusicStore';
import { useNavStore } from '../store/useNavStore';

// Helper to format music time since it's not exported from store/useMusicStore yet (or we can duplicate)
const formatSeconds = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const DynamicIsland: React.FC = () => {
    // Timer State
    const {
        timeLeft, isActive: isTimerActive, totalTime,
        start: startTimer, pause: pauseTimer
    } = useTimerStore();

    // Music State
    const {
        currentTrack, isPlaying: isMusicPlaying, playlists, activePlaylistId,
        togglePlay: toggleMusic, nextTrack, prevTrack,
        currentTime, duration, setActivePlaylist, setSeek
    } = useMusicStore();

    // Nav
    const setActiveTab = useNavStore((state) => state.setActiveTab);

    // Local UI State
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);

    // Derived States
    const hasActiveTimer = isTimerActive || timeLeft < totalTime;
    const hasActiveMusic = !!currentTrack;

    // Determine Width based on state
    const getWidth = () => {
        if (isExpanded) return 'w-[360px]'; // Full expanded
        if (hasActiveTimer && hasActiveMusic) return 'w-[180px]'; // Both compact
        if (hasActiveTimer || hasActiveMusic) return 'w-[140px]'; // Single compact
        return 'w-[60px]'; // Idle (Music Icon)
    };

    // Calculate Timer Progress
    const timerProgress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
    const circumference = 2 * Math.PI * 9; // smaller radius 9
    const strokeDashoffset = circumference - (timerProgress / 100) * circumference;

    const handleExpandToggle = () => {
        setIsExpanded(!isExpanded);
    };

    // Click outside handler
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isExpanded && !(e.target as Element).closest('.dynamic-island-container')) {
                setIsExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded]);

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
            {/* ISLAND CONTAINER */}
            <div
                className={`
                    dynamic-island-container
                    relative bg-black/40 backdrop-blur-[40px] saturate-150 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[32px]
                    transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
                    before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none
                    ${getWidth()}
                    ${isExpanded ? 'h-auto p-4 ring-1 ring-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]' : 'h-[40px] hover:scale-[1.02] cursor-pointer hover:bg-black/50'}
                `}
                onClick={!isExpanded ? handleExpandToggle : undefined}
            >
                {/* --- COMPACT VIEW (COLLAPSED) --- */}
                {!isExpanded && (
                    <div className="absolute inset-0 flex items-center justify-center gap-3 px-2">

                        {/* IDLE STATE - Show Music Icon to hint functionality */}
                        {!hasActiveTimer && !hasActiveMusic && (
                            <div className="text-gray-500 hover:text-white transition-colors">
                                <Music size={16} />
                            </div>
                        )}

                        {/* TIMER COMPACT */}
                        {hasActiveTimer && (
                            <div className="flex items-center gap-2">
                                <div className="relative w-6 h-6">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="12" cy="12" r="9" stroke="#333" strokeWidth="2" fill="none" />
                                        <circle cx="12" cy="12" r="9" stroke="#818cf8" strokeWidth="2" fill="none"
                                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {isTimerActive ?
                                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-[1px]" /> :
                                            <Play size={8} className="text-indigo-400 ml-0.5" fill="currentColor" />
                                        }
                                    </div>
                                </div>
                                <span className={`text-xs font-mono font-medium ${isTimerActive ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        )}

                        {/* DIVIDER if both active */}
                        {hasActiveTimer && hasActiveMusic && (
                            <div className="w-[1px] h-4 bg-white/10" />
                        )}

                        {/* MUSIC COMPACT */}
                        {hasActiveMusic && (
                            <div className="flex items-center gap-2 max-w-[80px]">
                                {isMusicPlaying ? (
                                    <div className="flex gap-[2px] items-end h-3">
                                        <div className="w-[2px] bg-green-500 animate-[music-bar_0.5s_ease-in-out_infinite] h-2" />
                                        <div className="w-[2px] bg-green-500 animate-[music-bar_0.7s_ease-in-out_infinite_0.1s] h-3" />
                                        <div className="w-[2px] bg-green-500 animate-[music-bar_0.4s_ease-in-out_infinite_0.2s] h-1.5" />
                                    </div>
                                ) : (
                                    <Music size={14} className="text-gray-400" />
                                )}
                                <span className="text-xs truncate text-gray-300 max-w-full">
                                    {currentTrack!.title}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* --- EXPANDED VIEW --- */}
                {isExpanded && (
                    <div className="flex flex-col w-full animate-in fade-in duration-300">
                        {/* HEADER: Close Button */}
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Dynamic Control</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={14} className="text-gray-400" />
                            </button>
                        </div>

                        {/* TIMER SECTION */}
                        {hasActiveTimer && (
                            <div className="flex items-center gap-4 mb-4 p-3 bg-white/5 rounded-2xl">
                                <div className="text-2xl font-mono text-indigo-200">
                                    {formatTime(timeLeft)}
                                </div>
                                <div className="flex-1 flex justify-end gap-2">
                                    <button
                                        onClick={() => isTimerActive ? pauseTimer() : startTimer()}
                                        className="p-2 rounded-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                                    >
                                        {isTimerActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                    </button>
                                    <button
                                        onClick={() => { setIsExpanded(false); setActiveTab('zen'); }}
                                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-full text-gray-300 transition-colors"
                                    >
                                        Open Zen
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* MUSIC SECTION */}
                        {hasActiveMusic && currentTrack && (
                            <div className="flex flex-col gap-3">
                                {/* Track Info */}
                                <div className="flex gap-3">
                                    <img
                                        src={currentTrack.thumbnail}
                                        className="w-12 h-12 rounded-lg object-cover bg-gray-800"
                                        alt="album art"
                                    />
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="font-medium text-white text-sm truncate">{currentTrack.title}</div>
                                        <div className="text-xs text-gray-400">
                                            {formatSeconds(currentTime)} / {formatSeconds(duration)}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div
                                    className="h-1 bg-gray-700 rounded-full cursor-pointer relative group"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const pct = (e.clientX - rect.left) / rect.width;
                                        setSeek(pct * duration);
                                    }}
                                >
                                    <div
                                        className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-300"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    />
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between px-2">
                                    <button onClick={() => setShowPlaylistPicker(!showPlaylistPicker)} className="text-gray-400 hover:text-white">
                                        <ChevronDown size={18} />
                                    </button>
                                    <div className="flex gap-4">
                                        <button onClick={prevTrack} className="text-white hover:text-gray-300"><SkipBack size={20} /></button>
                                        <button onClick={toggleMusic} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
                                            {isMusicPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" />}
                                        </button>
                                        <button onClick={nextTrack} className="text-white hover:text-gray-300"><SkipForward size={20} /></button>
                                    </div>
                                    <div className="w-5" /> {/* Spacer */}
                                </div>
                            </div>
                        )}

                        {/* PLAYLIST PICKER OVERLAY */}
                        {showPlaylistPicker && (
                            <div className="pt-3 mt-3 border-t border-white/10 max-h-40 overflow-y-auto">
                                <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">Playlists</div>
                                {playlists.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setActivePlaylist(p.id); setShowPlaylistPicker(false); }}
                                        className={`w-full text-left px-2 py-1.5 text-xs rounded-md mb-1 transition-colors ${p.id === activePlaylistId ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5 text-gray-300'
                                            }`}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* EMPTY STATE MSG & PICKER */}
                        {!hasActiveMusic && (
                            <div className="p-4 flex flex-col items-center gap-3">
                                <div className="text-center text-xs text-gray-500">
                                    No music playing. Select a playlist to start.
                                </div>
                                <button
                                    onClick={() => setShowPlaylistPicker(!showPlaylistPicker)}
                                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs rounded-full transition-colors flex items-center gap-2"
                                >
                                    <Music size={14} />
                                    <span>Select Playlist</span>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${showPlaylistPicker ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes music-bar {
                    0%, 100% { height: 4px; }
                    50% { height: 10px; }
                }
            `}</style>
        </div>
    );
};

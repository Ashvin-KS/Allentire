import React, { useState, useRef, useEffect, useCallback } from 'react';
import YouTube from 'react-youtube';
import { Play, Pause, SkipBack, SkipForward, Music, ChevronDown, ChevronUp, Disc3 } from 'lucide-react';

const LS_PLAYLISTS = 'musicapp_playlists';
const API_BASE = 'http://localhost:10000';

interface Track {
    id: string;
    title: string;
    thumbnail: string;
}

interface Playlist {
    id: number;
    name: string;
    tracks: Track[];
}

export const MiniPlayer: React.FC = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [activePlaylistId, setActivePlaylistId] = useState<number | null>(null);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);

    const playerRef = useRef<any>(null);
    const intervalRef = useRef<number | null>(null);

    // Load playlists
    useEffect(() => {
        const loadPlaylists = async () => {
            try {
                const res = await fetch(`${API_BASE}/playlists`);
                const data = await res.json();
                if (Array.isArray(data)) setPlaylists(data);
            } catch {
                const saved = localStorage.getItem(LS_PLAYLISTS);
                if (saved) setPlaylists(JSON.parse(saved));
            }
        };
        loadPlaylists();
        const interval = setInterval(loadPlaylists, 5000);
        return () => clearInterval(interval);
    }, []);

    const activePlaylist = playlists.find(p => p.id === activePlaylistId);

    const playTrack = useCallback((idx: number) => {
        if (!activePlaylist || activePlaylist.tracks.length === 0) return;
        setCurrentIndex(idx);
        setCurrentTrack(activePlaylist.tracks[idx]);
        setIsPlaying(true);
    }, [activePlaylist]);

    const togglePlay = useCallback(() => {
        if (!currentTrack && activePlaylist && activePlaylist.tracks.length > 0) {
            playTrack(0);
            return;
        }
        if (!playerRef.current) return;
        if (isPlaying) playerRef.current.pauseVideo();
        else playerRef.current.playVideo();
        setIsPlaying(prev => !prev);
    }, [currentTrack, activePlaylist, playTrack, isPlaying]);

    const playNext = useCallback(() => {
        if (!activePlaylist || activePlaylist.tracks.length === 0) return;
        const next = (currentIndex + 1) % activePlaylist.tracks.length;
        playTrack(next);
    }, [activePlaylist, currentIndex, playTrack]);

    const playPrev = useCallback(() => {
        if (!activePlaylist || activePlaylist.tracks.length === 0) return;
        if (currentTime > 10 && playerRef.current) {
            playerRef.current.seekTo(0, true);
            setCurrentTime(0);
            return;
        }
        const prev = (currentIndex - 1 + activePlaylist.tracks.length) % activePlaylist.tracks.length;
        playTrack(prev);
    }, [activePlaylist, currentIndex, playTrack, currentTime]);

    const onPlayerReady = (event: any) => {
        playerRef.current = event.target;
        setDuration(playerRef.current.getDuration());
        if (isPlaying) playerRef.current.playVideo();
    };

    const onPlayerStateChange = (event: any) => {
        setDuration(playerRef.current?.getDuration() || 0);
        if (event.data === 1) {
            setIsPlaying(true);
            startTimer();
        } else if (event.data === 2 || event.data === 0) {
            setIsPlaying(false);
            stopTimer();
        }
        if (event.data === 0) playNext();
    };

    const startTimer = () => {
        stopTimer();
        intervalRef.current = window.setInterval(() => {
            if (playerRef.current) setCurrentTime(playerRef.current.getCurrentTime());
        }, 250);
    };

    const stopTimer = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    useEffect(() => () => stopTimer(), []);

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!playerRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        playerRef.current.seekTo(percent * duration, true);
    };

    const formatTime = (t: number) => {
        if (isNaN(t)) return '0:00';
        return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
    };

    const selectPlaylist = (id: number) => {
        setActivePlaylistId(id);
        setShowPlaylistPicker(false);
        const playlist = playlists.find(p => p.id === id);
        if (playlist && playlist.tracks.length > 0) {
            setCurrentIndex(0);
            setCurrentTrack(playlist.tracks[0]);
            setIsPlaying(true);
        }
    };

    // Click outside to close
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
                setShowPlaylistPicker(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);

    return (
        <>
            {/* Hidden YouTube player - always mounted to persist playback */}
            <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
                {currentTrack && (
                    <YouTube
                        videoId={currentTrack.id}
                        opts={{ height: '1', width: '1', playerVars: { autoplay: 1, controls: 0 } }}
                        onReady={onPlayerReady}
                        onStateChange={onPlayerStateChange}
                    />
                )}
            </div>

            {/* Floating Music Button */}
            <div
                ref={containerRef}
                style={{
                    position: 'fixed',
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Expanded Controls Panel */}
                {isExpanded && (
                    <div style={{
                        background: 'rgba(24, 24, 24, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        width: 280,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        {/* Playlist Picker */}
                        <div style={{ marginBottom: 12 }}>
                            <button
                                onClick={() => setShowPlaylistPicker(!showPlaylistPicker)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    background: '#282828',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: '#fff',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                }}
                            >
                                <span>{activePlaylist?.name || 'Select Playlist'}</span>
                                <ChevronDown size={16} />
                            </button>

                            {showPlaylistPicker && (
                                <div style={{
                                    marginTop: 4,
                                    background: '#282828',
                                    borderRadius: 8,
                                    maxHeight: 150,
                                    overflowY: 'auto',
                                }}>
                                    {playlists.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => selectPlaylist(p.id)}
                                            style={{
                                                padding: '10px 12px',
                                                cursor: 'pointer',
                                                background: p.id === activePlaylistId ? '#1ed760' : 'transparent',
                                                color: p.id === activePlaylistId ? '#000' : '#fff',
                                            }}
                                        >
                                            {p.name} ({p.tracks.length})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Current Track */}
                        {currentTrack && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <img
                                    src={currentTrack.thumbnail}
                                    alt=""
                                    style={{ width: 48, height: 48, borderRadius: 6 }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        color: '#fff',
                                    }}>
                                        {currentTrack.title}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#b3b3b3' }}>
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div
                            onClick={handleProgressClick}
                            style={{
                                height: 4,
                                background: '#4d4d4d',
                                borderRadius: 2,
                                cursor: 'pointer',
                                marginBottom: 12,
                            }}
                        >
                            <div style={{
                                height: '100%',
                                width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                                background: '#1ed760',
                                borderRadius: 2,
                            }} />
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                            <button onClick={playPrev} style={btnStyle}><SkipBack size={20} /></button>
                            <button onClick={togglePlay} style={{ ...btnStyle, background: '#fff', color: '#000', width: 40, height: 40 }}>
                                {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" style={{ marginLeft: 2 }} />}
                            </button>
                            <button onClick={playNext} style={btnStyle}><SkipForward size={20} /></button>
                        </div>
                    </div>
                )}

                {/* Floating Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: isPlaying ? '#1ed760' : '#282828',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: isPlaying ? '0 4px 20px rgba(30, 215, 96, 0.5)' : '0 4px 20px rgba(0,0,0,0.4)',
                        transition: 'all 0.3s',
                    }}
                >
                    <Music size={24} color={isPlaying ? '#000' : '#fff'} />
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 4px 20px rgba(30, 215, 96, 0.4); }
                    50% { box-shadow: 0 4px 30px rgba(30, 215, 96, 0.7); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#b3b3b3',
    cursor: 'pointer',
    padding: 8,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

export default MiniPlayer;

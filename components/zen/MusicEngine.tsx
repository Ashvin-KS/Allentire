import React, { useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { useMusicStore, Playlist } from '../../store/useMusicStore';

const LS_PLAYLISTS = 'musicapp_playlists';
const API_BASE = 'http://localhost:10000';

export const MusicEngine: React.FC = () => {
    // Store
    const {
        setPlaylists,
        currentTrack,
        isPlaying,
        nextTrack,
        togglePlay, // used for cleanup/status updates
        play,
        pause,
        updateProgress,
        seekTo,
        clearSeek
    } = useMusicStore();

    const playerRef = useRef<any>(null);
    const intervalRef = useRef<number | null>(null);

    // Initial Playlist Load
    useEffect(() => {
        const loadPlaylists = async () => {
            try {
                const res = await fetch(`${API_BASE}/playlists`);
                const data = await res.json();
                if (Array.isArray(data)) setPlaylists(data);
            } catch {
                const saved = localStorage.getItem(LS_PLAYLISTS);
                if (saved) setPlaylists(JSON.parse(saved) as Playlist[]);
            }
        };
        loadPlaylists();
        const interval = setInterval(loadPlaylists, 5000);
        return () => clearInterval(interval);
    }, [setPlaylists]);

    // Handle Play/Pause changes from Store
    useEffect(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.playVideo();
            startTimer();
        } else {
            playerRef.current.pauseVideo();
            stopTimer();
        }
    }, [isPlaying]);

    // Handle Seek changes from Store
    useEffect(() => {
        if (seekTo !== null && playerRef.current) {
            playerRef.current.seekTo(seekTo, true);
            clearSeek();
        }
    }, [seekTo, clearSeek]);

    // Player Event Handlers
    const onPlayerReady = (event: any) => {
        playerRef.current = event.target;
        if (isPlaying) playerRef.current.playVideo();
    };

    const onPlayerStateChange = (event: any) => {
        const duration = playerRef.current?.getDuration() || 0;

        // Sync duration immediately
        updateProgress(playerRef.current?.getCurrentTime() || 0, duration);

        if (event.data === 1) { // Playing
            if (!isPlaying) play(); // Sync store if player started internally
            startTimer();
        } else if (event.data === 2 || event.data === 0) { // Paused or Ended
            if (isPlaying && event.data === 2) pause(); // Sync store if paused internally
            stopTimer();
        }

        if (event.data === 0) { // Ended
            nextTrack();
        }
    };

    const startTimer = () => {
        stopTimer();
        intervalRef.current = window.setInterval(() => {
            if (playerRef.current) {
                updateProgress(
                    playerRef.current.getCurrentTime(),
                    playerRef.current.getDuration()
                );
            }
        }, 500); // Update every 500ms
    };

    const stopTimer = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    // Cleanup
    useEffect(() => () => stopTimer(), []);

    if (!currentTrack) return null;

    return (
        <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
            <YouTube
                videoId={currentTrack.id}
                opts={{ height: '1', width: '1', playerVars: { autoplay: 1, controls: 0 } }}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
            />
        </div>
    );
};

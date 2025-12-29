import { create } from 'zustand';

// Duplicate interfaces to avoid circular deps with MiniPlayer/Engine
export interface Track {
    id: string;
    title: string;
    thumbnail: string;
}

export interface Playlist {
    id: number;
    name: string;
    tracks: Track[];
}

interface MusicState {
    playlists: Playlist[];
    activePlaylistId: number | null;
    currentTrack: Track | null;
    currentIndex: number;
    isPlaying: boolean;
    duration: number;
    currentTime: number;

    // Actions
    setPlaylists: (playlists: Playlist[]) => void;
    setActivePlaylist: (id: number) => void;
    setTrack: (track: Track, index: number) => void;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    updateProgress: (currentTime: number, duration: number) => void;

    // Engine Control Flags (used by UI to signal Engine)
    seekTo: number | null; // Signal to seek
    setSeek: (time: number) => void;
    clearSeek: () => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
    playlists: [],
    activePlaylistId: null,
    currentTrack: null,
    currentIndex: 0,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    seekTo: null,

    setPlaylists: (playlists) => set({ playlists }),

    setActivePlaylist: (id) => {
        set({ activePlaylistId: id });
        const playlist = get().playlists.find(p => p.id === id);
        if (playlist && playlist.tracks.length > 0) {
            // Auto-start first track of new playlist
            get().setTrack(playlist.tracks[0], 0);
            get().play();
        }
    },

    setTrack: (track, index) => set({ currentTrack: track, currentIndex: index }),

    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

    nextTrack: () => {
        const { activePlaylistId, playlists, currentIndex } = get();
        const playlist = playlists.find(p => p.id === activePlaylistId);
        if (!playlist || playlist.tracks.length === 0) return;

        const nextIndex = (currentIndex + 1) % playlist.tracks.length;
        set({
            currentTrack: playlist.tracks[nextIndex],
            currentIndex: nextIndex,
            isPlaying: true
        });
    },

    prevTrack: () => {
        const { activePlaylistId, playlists, currentIndex, currentTime } = get();
        const playlist = playlists.find(p => p.id === activePlaylistId);
        if (!playlist || playlist.tracks.length === 0) return;

        // If played more than 3 sec, restart track
        if (currentTime > 3) {
            set({ seekTo: 0 }); // Signal engine to restart
            return;
        }

        const prevIndex = (currentIndex - 1 + playlist.tracks.length) % playlist.tracks.length;
        set({
            currentTrack: playlist.tracks[prevIndex],
            currentIndex: prevIndex,
            isPlaying: true
        });
    },

    updateProgress: (currentTime, duration) => set({ currentTime, duration }),

    setSeek: (time) => set({ seekTo: time }),
    clearSeek: () => set({ seekTo: null }),
}));

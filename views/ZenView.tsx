import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Moon } from 'lucide-react';
import { useTimerStore, formatTime } from '../store/useTimerStore';
import { useMusicStore } from '../store/useMusicStore';

export const ZenView: React.FC = () => {
  const { timeLeft, isActive, start, pause, reset } = useTimerStore();
  const [dndEnabled, setDndEnabled] = React.useState(false);

  const toggleTimer = () => {
    if (isActive) {
      pause();
    } else {
      start();
    }
  };

  const handleReset = () => {
    reset();
  };

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative bg-[#050505] overflow-hidden rounded-xl animate-in fade-in duration-700">

      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* --- COMPONENT A: FOCUS TIMER --- */}
      <div className="z-20 flex flex-col items-center mb-10">
        <div className="relative group">
          <div className={`text-8xl md:text-9xl font-thin font-mono tracking-tighter tabular-nums transition-colors duration-500 ${isActive ? 'text-indigo-200 drop-shadow-[0_0_15px_rgba(165,180,252,0.3)]' : 'text-gray-500'}`}>
            {formatTime(timeLeft)}
          </div>

          {/* Controls overlaid/below */}
          <div className="flex items-center justify-center gap-6 mt-6 opacity-80 hover:opacity-100 transition-opacity">
            <button
              onClick={toggleTimer}
              className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all"
            >
              {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>

            <button
              onClick={handleReset}
              className="w-10 h-10 rounded-full bg-transparent border border-transparent flex items-center justify-center text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* --- COMPONENT B: PLAYLIST SELECTION --- */}
      <div className="z-20 w-full max-w-2xl px-6 mt-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Quick Focus Mixes
          </span>
          <a
            href="http://localhost:5173" // External Music App URL
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            Open Music App <Play size={10} />
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {useMusicStore.getState().playlists.slice(0, 3).map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => useMusicStore.getState().setActivePlaylist(playlist.id)}
              className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-300 text-left h-32 flex flex-col justify-end p-4"
            >
              {/* Background Image */}
              {playlist.tracks.length > 0 && (
                <>
                  <img
                    src={playlist.tracks[0].thumbnail}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </>
              )}

              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold text-white truncate drop-shadow-md">
                    {playlist.name}
                  </span>
                  <span className="text-[10px] text-gray-300 font-medium">
                    {playlist.tracks.length} tracks
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* --- COMPONENT C: AMBIENT TOGGLE --- */}
      <div className="z-20 mt-10 flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/5 backdrop-blur-md">
        <Moon size={16} className={dndEnabled ? 'text-indigo-400' : 'text-gray-500'} />
        <span className={`text-xs font-bold uppercase tracking-widest ${dndEnabled ? 'text-indigo-200' : 'text-gray-500'}`}>
          Do Not Disturb
        </span>

        <button
          onClick={() => setDndEnabled(!dndEnabled)}
          className={`
            w-10 h-5 rounded-full relative transition-colors duration-300
            ${dndEnabled ? 'bg-indigo-500/50' : 'bg-gray-800'}
          `}
        >
          <div className={`
            absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm
            ${dndEnabled ? 'left-6' : 'left-1'}
          `} />
        </button>
      </div>

    </div>
  );
};
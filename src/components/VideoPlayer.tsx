"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Maximize, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  roomSync: {
    isPlaying: boolean;
    currentTime: number;
    lastUpdatedBy: string;
    onPlay: (time: number) => void;
    onPause: (time: number) => void;
    onSeek: (time: number) => void;
    updateMyProgress: (time: number, isPlaying: boolean) => void;
    syncToFarthest: () => void;
  };
  userId: string;
}

export default function VideoPlayer({ url, roomSync, userId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastProgressSentAtRef = useRef(0);
  const [hls, setHls] = useState<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // 1: Initialize HLS.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let newHls: Hls;

    if (Hls.isSupported()) {
      newHls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 8,
        maxMaxBufferLength: 30,
        maxBufferHole: 0.5,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
      });
      newHls.loadSource(url);
      newHls.attachMedia(video);
      
      newHls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Can auto play based on sync state wait if we need to 
        // Sync duration
      });

      setHls(newHls);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // native support iOS
      video.src = url;
    }

    return () => {
      if (newHls) newHls.destroy();
    };
  }, [url]);

  // Apply volume/mute to the actual media element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(1, Math.max(0, muted ? 0 : volume));
    video.muted = muted || volume === 0;
  }, [volume, muted]);

  // 2: Apply Sync state (Watch Party Sync Logic)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ignore sync updates that WE originated 
    // Wait, the hook outside determines it, but here we enforce remote updates
    if (roomSync.lastUpdatedBy === userId) return;

    if (roomSync.isPlaying && video.paused) {
      video.play().catch(e => console.error("Playback prevented:", e));
    } else if (!roomSync.isPlaying && !video.paused) {
      video.pause();
    }

    // Sync drift correction:
    // - big drift: hard seek
    // - small drift: gently adjust playbackRate to converge (keeps audio/video smoother)
    const drift = (video.currentTime || 0) - (roomSync.currentTime || 0);
    const abs = Math.abs(drift);

    if (abs > 0.75) {
      video.playbackRate = 1;
      video.currentTime = roomSync.currentTime;
    } else if (abs > 0.15 && roomSync.isPlaying && !video.paused) {
      // If we're ahead, slow down; if behind, speed up
      video.playbackRate = drift > 0 ? 0.95 : 1.05;
    } else {
      video.playbackRate = 1;
    }
  }, [roomSync.isPlaying, roomSync.currentTime, roomSync.lastUpdatedBy, userId]);

  // Video Event Handlers targeting internal update + dispatch to Sync Hook
  const handlePlay = () => {
    if (videoRef.current) {
      setIsPlaying(true);
      roomSync.onPlay(videoRef.current.currentTime);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      setIsPlaying(false);
      roomSync.onPause(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      roomSync.onSeek(newTime);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const t = video.currentTime || 0;
    setCurrentTime(t);

    const now = Date.now();
    if (now - lastProgressSentAtRef.current >= 1000) {
      lastProgressSentAtRef.current = now;
      roomSync.updateMyProgress(t, !video.paused);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      el?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) return `${h}:${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  const effectiveVolume = muted ? 0 : volume;
  const volumePercent = Math.round(effectiveVolume * 100);

  return (
    <div ref={containerRef} className="w-full max-w-[1100px]">
      <div className="w-full aspect-video bg-black rounded-[18px] md:rounded-[24px] overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/5 group">
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black cursor-pointer"
          onPlay={handlePlay}
          onPause={handlePause}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          autoPlay={roomSync.isPlaying}
        />

        {isBuffering && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 gap-3 bg-black/40">
            <svg className="animate-spin h-12 w-12 text-[#e50914]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="15 85" strokeLinecap="round"></circle>
            </svg>
          </div>
        )}

        {!isPlaying && !isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:bg-black/20 transition-colors">
            <div className="w-[70px] h-[70px] md:w-[86px] md:h-[86px] bg-[#e50914] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(229,9,20,0.4)]">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        )}

        {/* Bottom overlay controls (HDRezka-style) */}
        <div className="absolute left-0 right-0 bottom-0 z-20 px-3 py-3 md:px-5 md:py-4">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          <div className="relative pointer-events-auto flex items-center gap-3 md:gap-4">
            <button
              onClick={togglePlay}
              className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 transition flex items-center justify-center"
              aria-label={isPlaying ? "Пауза" : "Плей"}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div className="flex-1 h-[6px] bg-white/15 rounded-[999px] relative cursor-pointer group/slider flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute z-30 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="h-full bg-[#e50914] rounded-[999px] relative pointer-events-none"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                >
                  <div className="absolute -right-2 -top-[5px] w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                </div>
              </div>

              <span className="text-[12px] md:text-[13px] text-white/80 tabular-nums whitespace-nowrap font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={roomSync.syncToFarthest}
              className="shrink-0 bg-[#e50914] text-white px-3 py-2 md:px-4 md:py-2.5 rounded-[12px] font-semibold text-xs md:text-sm shadow-md hover:bg-[#f40b17] transition-colors whitespace-nowrap"
            >
              Синхр.
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setMuted((v) => !v)}
                className="text-white/80 hover:text-white transition-all outline-none p-1"
                aria-label={muted || volume === 0 ? "Вкл. звук" : "Выкл. звук"}
              >
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <div className="w-[88px] md:w-[110px] h-[6px] bg-white/15 rounded-[999px] relative">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={effectiveVolume}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    setVolume(num);
                    if (num > 0 && muted) setMuted(false);
                  }}
                  className="absolute inset-0 z-20 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="h-full bg-[#e50914] rounded-[999px]"
                  style={{ width: `${volumePercent}%` }}
                />
                <div
                  className="absolute -top-[5px] w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  style={{ left: `calc(${volumePercent}% - 8px)` }}
                />
              </div>

              <span className="text-[11px] text-white/70 tabular-nums w-[38px] text-right">
                {volumePercent}%
              </span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 transition flex items-center justify-center"
              aria-label="На весь экран"
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

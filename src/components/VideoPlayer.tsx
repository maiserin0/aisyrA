"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils"; // standard UI tailwind-merge helper

interface VideoPlayerProps {
  url: string;
  roomSync: {
    isPlaying: boolean;
    currentTime: number;
    lastUpdatedBy: string;
    onPlay: (time: number) => void;
    onPause: (time: number) => void;
    onSeek: (time: number) => void;
  };
  userId: string;
}

export default function VideoPlayer({ url, roomSync, userId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
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
         // Optimize for slow internet logic config could go here setup
         maxBufferLength: 30, // HLS adaptive streaming limits
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

    // Seek if sync drift is bigger than 2 seconds (latency comp)
    if (Math.abs(video.currentTime - roomSync.currentTime) > 2.0) {
      video.currentTime = roomSync.currentTime;
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

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  return (
    <div className="relative group w-full bg-black rounded-xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        className="w-full h-auto aspect-video cursor-pointer bg-black"
        onPlay={handlePlay}
        onPause={handlePause}
        onClick={togglePlay}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        autoPlay={roomSync.isPlaying} // starts depending on latest sync
      />
      
      {/* Buffering Indicator */}
      {isBuffering && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white opacity-80">
           <svg className="animate-spin h-10 w-10 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8"></path>
           </svg>
         </div>
      )}

      {/* Controls UI overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        
        {/* Timeline Slider */}
        <input 
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-2"
        />

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <button onClick={togglePlay} className="text-white hover:text-red-500">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-red-500" onClick={() => setMuted(!muted)}>
              {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <input 
              type="range" min="0" max="1" step="0.05" 
              value={muted ? 0 : volume} 
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                setVolume(num);
                if (videoRef.current) videoRef.current.volume = num;
                if (num > 0 && muted) setMuted(false);
              }}
              className="w-20 accent-red-600"
            />
            <button onClick={() => videoRef.current?.requestFullscreen()} className="text-white hover:text-red-500">
              <Maximize size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState, useRef } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';

export type RoomState = {
  id: string;
  currentTime: number;
  isPlaying: boolean;
  lastUpdatedBy: string;
  videoUrl?: string; // Optional dynamically loaded url for room sync
};

export const useWatchParty = (roomId: string) => {
  const { user } = useAuth();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  
  // Track our own updates to avoid debounce loop
  const _pendingUpdate = useRef<{ time: number, type: string } | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(database, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setRoomState(data);
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  const pushState = (isPlaying: boolean, currentTime: number) => {
    if (!user || !roomId) return;
    
    // Store pending update locally to prevent echo updates
    _pendingUpdate.current = { time: currentTime, type: isPlaying ? 'play' : 'pause' };
    
    update(ref(database, `rooms/${roomId}`), {
      isPlaying,
      currentTime,
      lastUpdatedBy: user.uid,
      timestamp: Date.now()
    });
  };

  const syncFunctions = {
    isPlaying: roomState?.isPlaying || false,
    currentTime: roomState?.currentTime || 0,
    lastUpdatedBy: roomState?.lastUpdatedBy || '',
    onPlay: (time: number) => pushState(true, time),
    onPause: (time: number) => pushState(false, time),
    onSeek: (time: number) => pushState(roomState?.isPlaying || false, time),
    changeVideo: (url: string) => {
      if (!user || !roomId) return;
      update(ref(database, `rooms/${roomId}`), { videoUrl: url, currentTime: 0, isPlaying: false, lastUpdatedBy: user.uid });
    }
  };

  return { roomState, syncFunctions };
};

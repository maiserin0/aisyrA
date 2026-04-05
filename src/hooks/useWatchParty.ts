"use client";
import { useEffect, useState, useRef } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, update, onDisconnect } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';

export type RoomState = {
  id: string;
  currentTime: number;
  isPlaying: boolean;
  lastUpdatedBy: string;
  videoUrl?: string; // Optional dynamically loaded url for room sync
};

export type ParticipantState = {
  uid: string;
  displayName: string;
  photoURL?: string;
  currentTime: number;
  isPlaying: boolean;
  updatedAt: number;
};

export const useWatchParty = (roomId: string) => {
  const { user } = useAuth();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [participants, setParticipants] = useState<Record<string, ParticipantState>>({});
  
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

  useEffect(() => {
    if (!roomId) return;
    const participantsRef = ref(database, `rooms/${roomId}/participants`);
    const unsubscribe = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setParticipants(data);
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !user) return;

    const participantRef = ref(database, `rooms/${roomId}/participants/${user.uid}`);
    const displayName = user.displayName || user.email || 'User';
    const photoURL = user.photoURL || undefined;

    update(participantRef, {
      uid: user.uid,
      displayName,
      photoURL,
      currentTime: roomState?.currentTime || 0,
      isPlaying: roomState?.isPlaying || false,
      updatedAt: Date.now(),
    });

    onDisconnect(participantRef).remove();
  }, [roomId, user, roomState?.currentTime, roomState?.isPlaying]);

  const updateMyProgress = (currentTime: number, isPlaying: boolean) => {
    if (!roomId || !user) return;
    const participantRef = ref(database, `rooms/${roomId}/participants/${user.uid}`);
    update(participantRef, {
      uid: user.uid,
      displayName: user.displayName || user.email || 'User',
      photoURL: user.photoURL || null,
      currentTime,
      isPlaying,
      updatedAt: Date.now(),
    });
  };

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

    updateMyProgress(currentTime, isPlaying);
  };

  const syncToFarthest = async () => {
    if (!user || !roomId) return;
    const list = Object.values(participants);
    const farthest = list.length ? Math.max(...list.map(p => p.currentTime || 0)) : (roomState?.currentTime || 0);
    update(ref(database, `rooms/${roomId}`), {
      isPlaying: true,
      currentTime: farthest,
      lastUpdatedBy: user.uid,
      timestamp: Date.now(),
    });
    updateMyProgress(farthest, true);
  };

  const syncFunctions = {
    isPlaying: roomState?.isPlaying || false,
    currentTime: roomState?.currentTime || 0,
    lastUpdatedBy: roomState?.lastUpdatedBy || '',
    onPlay: (time: number) => pushState(true, time),
    onPause: (time: number) => pushState(false, time),
    onSeek: (time: number) => pushState(roomState?.isPlaying || false, time),
    updateMyProgress,
    syncToFarthest,
    changeVideo: (url: string) => {
      if (!user || !roomId) return;
      update(ref(database, `rooms/${roomId}`), { videoUrl: url, currentTime: 0, isPlaying: false, lastUpdatedBy: user.uid });
    }
  };

  return { roomState, participants, syncFunctions };
};

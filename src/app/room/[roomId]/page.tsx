"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useWatchParty } from "@/hooks/useWatchParty";
import VideoPlayer from "@/components/VideoPlayer";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// Mock Data Structure
const SERIES_DB = [
  { id: "e1", title: "S1:E1 Pilot", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
  { id: "e2", title: "S1:E2 Second Chapter", url: "https://test-streams.mux.dev/test_1/stream.m3u8" }
];

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string };
  const { user, loading } = useAuth();
  const { roomState, syncFunctions } = useWatchParty(roomId);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading || !user) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex bg-black h-screen overflow-hidden text-white">
      {/* Sidebar for Episodes */}
      <aside className="w-80 bg-zinc-950 border-r border-zinc-900 flex flex-col pt-6 hidden lg:flex">
        <h2 className="text-xl font-bold px-6 text-red-600 mb-8 border-b border-zinc-900 pb-4 tracking-tighter shadow-md">
           WATCH PARTY <span className="text-sm font-normal text-zinc-500 ml-2">#{roomId}</span>
        </h2>
        
        <div className="flex-1 overflow-y-auto px-4">
          <p className="text-xs uppercase font-extrabold text-zinc-400 mb-4 px-2">Episodes</p>
          <ul className="space-y-2">
            {SERIES_DB.map(ep => (
              <li key={ep.id}>
                <button 
                  onClick={() => syncFunctions.changeVideo(ep.url)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${roomState?.videoUrl === ep.url ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-900'}`}
                >
                   <span className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono">{ep.id.replace('e', '')}</span>
                   <span className="font-semibold">{ep.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* User Card */}
        <div className="mt-auto px-6 py-5 bg-zinc-950 border-t border-zinc-900 flex items-center gap-4 hover:bg-zinc-900 transition cursor-pointer">
           <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&bg=27272a&color=fff`} alt={user.displayName || "Avatar"} className="w-10 h-10 rounded-full border border-zinc-700" />
           <div className="flex flex-col">
             <span className="font-medium text-sm leading-tight">{user.displayName}</span>
             <span className="text-xs text-red-500 font-medium">Host</span>
           </div>
        </div>
      </aside>

      {/* Main Video Area */}
      <main className="flex-1 flex flex-col p-6 items-center justify-center pb-24 relative gap-6">
        <div className="w-full max-w-6xl relative z-10 shadow-[0_0_100px_rgba(220,38,38,0.05)] rounded-2xl">
          {roomState?.videoUrl ? (
             <VideoPlayer 
                url={roomState.videoUrl}
                roomSync={syncFunctions}
                userId={user.uid}
              />
          ) : (
             <div className="w-full aspect-video bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center">
                 <p className="text-zinc-500 font-semibold animate-pulse tracking-wide">Select an episode to start the party</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}

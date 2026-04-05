"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { nanoid } from "nanoid";

export default function Home() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    router.push(`/room/${newRoomId}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId) router.push(`/room/${roomId}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24 bg-gradient-to-br from-black to-zinc-900">
      <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-900 mb-8">
        Arysia Party
      </h1>
      
      {!user ? (
        <button 
          onClick={login}
          className="bg-white text-black font-semibold py-3 px-8 rounded-full hover:bg-gray-200 transition transform hover:scale-105"
        >
          Sign in with Google
        </button>
      ) : (
        <div className="flex flex-col gap-6 items-center w-full max-w-sm">
          <button 
            onClick={handleCreateRoom}
            className="w-full bg-red-600 text-white font-semibold py-4 px-8 rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-600/20"
          >
            Create New Room
          </button>
          
          <div className="flex items-center w-full text-zinc-500 gap-2">
            <div className="flex-1 h-px bg-zinc-800"></div>
            <span className="text-sm uppercase font-semibold">or join</span>
            <div className="flex-1 h-px bg-zinc-800"></div>
          </div>

          <form onSubmit={handleJoin} className="w-full flex gap-2">
            <input 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room Code"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 outline-none focus:border-red-600 transition"
            />
            <button 
              type="submit"
              className="bg-zinc-800 text-white font-semibold px-6 rounded-lg hover:bg-zinc-700 transition"
            >
              Join
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

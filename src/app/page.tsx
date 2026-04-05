"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { database } from "@/lib/firebase";
import { ref, get, child, set } from "firebase/database";

export default function Home() {
  const { user, login, logoutUser, authError } = useAuth();
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!user) return login();
    const newRoomId = Math.random().toString(36).substring(2, 9).toUpperCase();
    try {
      await set(ref(database, `rooms/${newRoomId}`), {
        id: newRoomId,
        createdAt: Date.now(),
        hostId: user.uid,
      });
      router.push(`/room/${newRoomId}`);
    } catch(err) {
      console.error(err);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return login();
    const trimmedId = roomId.trim().toUpperCase();
    if (!trimmedId) return;
    
    setLoading(true);
    setError("");
    
    try {
      const snapshot = await get(child(ref(database), `rooms/${trimmedId}`));
      if (snapshot.exists()) {
        router.push(`/room/${trimmedId}`);
      } else {
        setError("Invalid Room Code.");
      }
    } catch (err) {
      setError("Error joining room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell text-white flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div
        className="absolute w-[680px] h-[420px] rounded-full pointer-events-none blur-2xl"
        style={{
          top: "-12%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(229, 9, 20, 0.22) 0%, rgba(15, 15, 15, 0) 70%)",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header className="absolute top-0 w-full px-6 sm:px-10 py-5 flex justify-between items-center z-50">
        <div className="text-[20px] sm:text-[22px] font-black logo-mark">
          aisyr<span className="text-[#e50914]">A</span>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`}
              alt="Avatar"
              className="w-10 h-10 rounded-[8px] shrink-0 object-cover border border-white/10"
              style={{ background: "linear-gradient(45deg, #e50914, #ff5f6d)" }}
            />
            <button onClick={logoutUser} className="opacity-60 hover:opacity-100 transition cursor-pointer" title="Logout">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M10 17l5-5-5-5v10z"></path></svg>
            </button>
          </div>
        ) : (
          <button onClick={login} className="text-white hover:text-gray-300 font-semibold transition">
            Sign In
          </button>
        )}
      </header>

      {/* Main Form Card */}
      <div className="panel-card p-6 sm:p-10 w-full max-w-[420px] text-center relative z-10 transition-all fade-in">
        {!user ? (
           <>
            <h1 className="text-[26px] sm:text-[32px] mb-2 font-extrabold">Welcome back</h1>
            <p className="text-[#b3b3b3] mb-6 text-[14px]">Sign in to start watching together.</p>
            <button onClick={login} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[10px] text-[16px] font-semibold cursor-pointer transition-all border-none bg-[#e50914] hover:bg-[#f40b17] hover:-translate-y-[2px] shadow-[0_5px_15px_rgba(229,9,20,0.4)]">
              Sign In with Google
            </button>
            {authError && (
              <p className="mt-4 text-[#e50914] text-[13px] font-semibold">
                {authError}
              </p>
            )}
           </>
        ) : (
          <>
            <h1 className="text-[26px] sm:text-[32px] mb-2 font-extrabold text-white">Who's watching?</h1>
            <p className="text-[#b3b3b3] mb-6 text-[14px]">Start a new watch party or join your friends to watch episodes together in real-time.</p>

            <button onClick={handleCreateRoom} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] text-[16px] font-semibold cursor-pointer transition-all border-none bg-[#e50914] text-white hover:bg-[#f40b17] hover:-translate-y-[2px] shadow-[0_12px_25px_rgba(229,9,20,0.35)] mb-4">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M8 5v14l11-7z"></path></svg>
              Create Room
            </button>

            <div className="flex items-center text-[#b3b3b3] text-[12px] uppercase tracking-[1px] my-6 before:content-[''] before:flex-1 before:h-[1px] before:bg-white/10 after:content-[''] after:flex-1 after:h-[1px] after:bg-white/10">
                <span className="px-[15px]">OR</span>
            </div>

            <form onSubmit={handleJoin} className="flex flex-col">
                <div className="mb-4 relative">
                    <input 
                        type="text" 
                        placeholder="Enter Room Code (e.g. A32BD9)" 
                        value={roomId}
                        onChange={(e) => {
                          setRoomId(e.target.value);
                          setError("");
                        }}
                        className="w-full py-3.5 px-4 bg-[#232323] border-2 border-transparent rounded-[12px] text-white text-[16px] outline-none transition-all focus:border-[#e50914] focus:bg-[#2d2d2d] uppercase box-border"
                    />
                    {error && <p className="absolute -bottom-[22px] left-0 w-full text-center text-[#e50914] text-[13px] font-semibold">{error}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] text-[16px] font-semibold cursor-pointer transition-all bg-transparent border-2 border-[#2f2f2f] text-white hover:border-[#444] hover:bg-white/5 disabled:opacity-50 mt-1"
                 >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path></svg>
                    {loading ? "Joining..." : "Join Room"}
                </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
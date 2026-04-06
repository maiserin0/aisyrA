"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useWatchParty } from "@/hooks/useWatchParty";
import VideoPlayer from "@/components/VideoPlayer";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Menu, X, Play } from "lucide-react";

// Mock Data Structure
const SERIES_DB = [
  { id: "E07", title: "Эпизод 7", url: "https://pub-7dc63307e2754d61b8bcc0de12468371.r2.dev/ep-seven/index.m3u8" },
  { id: "E08", title: "Эпизод 8", url: "https://pub-7dc63307e2754d61b8bcc0de12468371.r2.dev/ep-eight/index.m3u8" },
  { id: "E09", title: "Эпизод 9", url: "https://pub-7dc63307e2754d61b8bcc0de12468371.r2.dev/nine/index.m3u8" },
  { id: "E10", title: "Эпизод 10", url: "https://pub-7dc63307e2754d61b8bcc0de12468371.r2.dev/ten/index.m3u8" },
  { id: "E11", title: "Эпизод 11", url: "https://pub-7dc63307e2754d61b8bcc0de12468371.r2.dev/eleven/index.m3u8" },
  { id: "E12", title: "Эпизод 12", url: "https://pub-7dc63307e2754d61b8bcc0de12468371.r2.dev/twelwe/index.m3u8" },
  { id: "E13", title: "Эпизод 13", url: "https://pub-7dc63307e2754d61b8bcc0de12468371.r2.dev/thirteen/index.m3u8" },
  { id: "S2E01", title: "Сезон 2 • Эпизод 1", url: "https://pub-7dc63307e2754d61b8bcc0de12468371.r2.dev/s2ep1/index.m3u8" }
];

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string };
  const { user, loading } = useAuth();
  const { roomState, participants, syncFunctions } = useWatchParty(roomId);
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const formatClock = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  const activeEpisode = useMemo(() => {
    if (roomState?.videoUrl) {
      return SERIES_DB.find(ep => ep.url && ep.url === roomState.videoUrl) || null;
    }
    return SERIES_DB.find(ep => ep.url) || null;
  }, [roomState?.videoUrl]);

  if (loading || !user) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen room-shell text-white overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-[280px] sm:w-[300px]
          bg-[#141414] border-r border-white/5 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-[28px] text-[20px] font-black logo-mark flex justify-between items-center">
          <span className="inline-flex items-center whitespace-nowrap">
            aisyr<span className="text-[#e50914]">A</span>
          </span>
          <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-[20px] py-[10px]">
          <h3 className="text-[12px] text-[#999] uppercase mb-[20px] pl-[10px] font-bold tracking-wider">Money Heist - Season 1</h3>
          <div className="space-y-2">
            {SERIES_DB.map(ep => {
              const isActive = roomState?.videoUrl && ep.url && roomState.videoUrl === ep.url;
              const isDisabled = !ep.url;
              return (
                <button
                  key={ep.id}
                  onClick={() => {
                    if (ep.url) syncFunctions.changeVideo(ep.url);
                    setIsSidebarOpen(false);
                  }}
                  disabled={isDisabled}
                  className={`
                    w-full p-[15px] rounded-[12px] text-left transition-colors duration-300
                    flex items-center gap-[12px] border border-transparent
                    ${isActive ? "bg-[#e50914]/10 border-[#e50914] text-white shadow-sm" : "hover:bg-white/5 text-gray-300"}
                    ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <span className="text-[11px] bg-[#333] px-[6px] py-[2px] rounded-[4px] text-[#999] font-bold">{ep.id}</span>
                  <span className="font-semibold text-sm leading-tight">{ep.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 border-t border-white/5 flex items-center gap-3 bg-black/20">
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&bg=e50914&color=fff`}
            alt={user.displayName || "Avatar"}
            className="w-10 h-10 rounded-lg border border-white/10"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{user.displayName}</span>
            <span className="text-xs text-[#999]">Host • #{roomId}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative w-full h-full min-w-0">
        <div className="p-4 md:px-10 md:py-5 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent shrink-0">
          <div className="flex items-center gap-3 md:gap-[15px] overflow-hidden">
            <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <span className="bg-white/5 px-2 md:px-3 py-1.5 border border-white/10 rounded-[20px] text-[11px] md:text-[12px] whitespace-nowrap shadow-sm">
              Room ID: <b className="font-bold">{roomId}</b>
            </span>
            <span className="font-semibold text-sm md:text-base truncate hidden sm:block">
              {activeEpisode ? `${activeEpisode.id} ${activeEpisode.title}` : "Select an episode"}
            </span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-[#222] text-[#ff4d4d] border border-[#ff4d4d]/20 px-3 py-1.5 md:px-[20px] md:py-[10px] rounded-[10px] md:rounded-[12px] font-semibold text-xs md:text-sm hover:bg-[#333] transition-colors whitespace-nowrap shadow-sm"
          >
            Выйти
          </button>
        </div>

        {roomState?.videoUrl ? (
          <div className="flex-1 px-4 md:px-10 pb-5 flex flex-col gap-4 items-center w-full min-h-0 overflow-y-auto">
            <VideoPlayer url={roomState.videoUrl} roomSync={syncFunctions} userId={user.uid} />

            <div className="w-full max-w-[1100px] control-panel rounded-[16px] p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm md:text-base font-semibold">
                  Участники: <span className="text-white/80">{Object.keys(participants || {}).length}</span>
                </div>
                <button
                  onClick={syncFunctions.syncToFarthest}
                  className="bg-[#e50914] text-white px-3 py-2 md:px-4 md:py-2.5 rounded-[12px] font-semibold text-xs md:text-sm shadow-md hover:bg-[#f40b17] transition-colors whitespace-nowrap"
                >
                  Синхр. к максимуму
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {Object.values(participants || {})
                  .sort((a, b) => {
                    const an = (a.displayName || "").toLowerCase();
                    const bn = (b.displayName || "").toLowerCase();
                    if (an < bn) return -1;
                    if (an > bn) return 1;
                    return (a.uid || "").localeCompare(b.uid || "");
                  })
                  .map((p) => (
                    <div
                      key={p.uid}
                      className="w-full sm:w-[260px] flex items-center gap-3 bg-white/5 border border-white/10 rounded-[14px] px-3 py-2"
                    >
                      <img
                        src={p.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.displayName || "User")}&bg=111&color=fff`}
                        alt={p.displayName || "User"}
                        className="w-8 h-8 rounded-[10px] object-cover border border-white/10"
                      />
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold max-w-[180px] truncate">{p.displayName || "User"}</span>
                        <span className="text-xs text-white/70 tabular-nums inline-flex items-center gap-2">
                          <span className="min-w-[44px]">{formatClock(p.currentTime || 0)}</span>
                          <span className="min-w-[58px]">{p.isPlaying ? "• играет" : "• пауза"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 px-4 md:px-10 pb-5 flex flex-col justify-center w-full min-h-0">
            <div className="w-full h-full bg-[#141414] border border-white/5 rounded-[24px] flex flex-col items-center justify-center gap-6 p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(229,9,20,0.12)_0%,transparent_70%)]" />
              <h2 className="text-[#999] text-xl md:text-2xl font-bold tracking-wide text-center relative z-10">
                Select an episode to start the party
              </h2>
              {activeEpisode?.url ? (
                <button
                  onClick={() => syncFunctions.changeVideo(activeEpisode.url)}
                  className="relative z-10 bg-[#e50914] text-white px-8 py-4 rounded-[14px] font-bold transition shadow-[0_0_24px_rgba(229,9,20,0.4)] flex items-center gap-3 hover:scale-105 hover:bg-[#f40b17]"
                >
                  <Play size={24} className="fill-white" />
                  Play {activeEpisode.id} {activeEpisode.title}
                </button>
              ) : (
                <span className="relative z-10 text-sm text-[#999]">No playable episodes yet.</span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

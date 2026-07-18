"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface VideoPlayerProps {
  src?: string;
  type: "youtube" | "upload";
  poster?: string;
  title?: string;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function formatTime(secs: number): string {
  if (!isFinite(secs)) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ── YouTube player (iframe with native controls) ── */
function YouTubePlayer({ videoId, title }: { videoId: string; title?: string }) {
  return (
    <div style={{ marginBottom: "2rem", width: "100%" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "56.25%",
          borderRadius: "1rem",
          overflow: "hidden",
          background: "#000",
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          title={title || "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}

/* ── SVG Icons ── */
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
);
const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
);
const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
);
const MuteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
);
const FullscreenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
);
const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
);
const SpeedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.38 8.57l-1.23 1.85a8 8 0 01-.22 7.58H5.07A8 8 0 0115.58 6.85l1.85-1.23A10 10 0 003.35 19a2 2 0 001.72 1h13.85a2 2 0 001.74-1 10 10 0 00-.27-10.44zm-9.79 6.84a2 2 0 002.83 0l5.66-8.49-8.49 5.66a2 2 0 000 2.83z"/></svg>
);
const PiPIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>
);

/* ── Custom Uploaded Video Player ── */
function UploadedVideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (playing) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.volume = volume;
    vid.muted = muted;
    vid.playbackRate = speed;
  }, [volume, muted, speed]);

  useEffect(() => {
    showControls();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [playing, showControls]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setPlaying(true); }
    else { vid.pause(); setPlaying(false); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const vid = videoRef.current;
    const bar = progressRef.current;
    if (!vid || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    vid.currentTime = pct * duration;
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) { await document.exitFullscreen(); setIsFullscreen(false); }
    else { await el.requestFullscreen(); setIsFullscreen(true); }
  };

  const togglePiP = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await vid.requestPictureInPicture();
    } catch {}
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  const controlBarBg = "rgba(0, 0, 0, 0.85)";
  const controlColor = "#fff";
  const hoverBg = "rgba(255,255,255,0.15)";

  return (
    <div
      ref={containerRef}
      style={{
        marginBottom: "2rem",
        position: "relative",
        borderRadius: "1rem",
        overflow: "hidden",
        background: "#000",
        border: "1px solid var(--border, #e5e5e5)",
        aspectRatio: "16/9",
        cursor: controlsVisible ? "default" : "none",
      }}
      onMouseMove={showControls}
      onMouseLeave={() => { if (playing) setControlsVisible(false); }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-no-propagate]")) return;
        togglePlay();
      }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-no-propagate]")) return;
        toggleFullscreen();
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
        playsInline
        preload="metadata"
        poster={poster}
        onTimeUpdate={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); }}
        onDurationChange={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
        onProgress={() => {
          const vid = videoRef.current;
          if (vid && vid.buffered.length > 0) setBuffered(vid.buffered.end(vid.buffered.length - 1));
        }}
        onLoadedData={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={src} />
      </video>

      {/* Loading spinner */}
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{
            width: 48, height: 48, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Controls overlay */}
      <div
        data-no-propagate
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: controlBarBg,
          padding: "0 12px 8px",
          opacity: controlsVisible ? 1 : 0,
          transition: "opacity 0.25s ease",
          pointerEvents: controlsVisible ? "auto" : "none",
          zIndex: 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          data-no-propagate
          onClick={handleSeek}
          style={{
            position: "relative",
            width: "100%",
            height: 6,
            borderRadius: 3,
            background: "rgba(255,255,255,0.25)",
            cursor: "pointer",
            marginBottom: 8,
          }}
        >
          {/* Buffered */}
          <div style={{
            position: "absolute", top: 0, left: 0, height: "100%",
            width: `${bufferedPct}%`, borderRadius: 3, background: "rgba(255,255,255,0.35)",
          }} />
          {/* Progress */}
          <div style={{
            position: "absolute", top: 0, left: 0, height: "100%",
            width: `${progress}%`, borderRadius: 3, background: "#e53935",
          }} />
          {/* Thumb */}
          <div style={{
            position: "absolute", top: "50%", left: `${progress}%`,
            width: 14, height: 14, borderRadius: "50%", background: "#e53935",
            transform: "translate(-50%, -50%)", boxShadow: "0 0 4px rgba(0,0,0,0.5)",
          }} />
        </div>

        {/* Controls row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: controlColor, fontSize: 13 }}>
          {/* Play/Pause */}
          <button data-no-propagate onClick={togglePlay}
            style={{ background: "none", border: "none", color: controlColor, cursor: "pointer", padding: 4, display: "flex", borderRadius: 4 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>

          {/* Volume */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} data-no-propagate>
            <button data-no-propagate onClick={() => setMuted(!muted)}
              style={{ background: "none", border: "none", color: controlColor, cursor: "pointer", padding: 4, display: "flex", borderRadius: 4 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
            </button>
            <input
              data-no-propagate
              type="range" min="0" max="1" step="0.05"
              value={muted ? 0 : volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
              style={{
                width: 70, height: 4, accentColor: "#e53935", cursor: "pointer",
              }}
            />
          </div>

          {/* Time */}
          <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", marginLeft: 4 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div style={{ flex: 1 }} />

          {/* Speed */}
          <div style={{ position: "relative" }} data-no-propagate>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              style={{
                background: showSpeedMenu ? hoverBg : "none", border: "none", color: controlColor,
                cursor: "pointer", padding: "4px 8px", borderRadius: 4, fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4,
              }}
              onMouseEnter={(e) => { if (!showSpeedMenu) e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={(e) => { if (!showSpeedMenu) e.currentTarget.style.background = "none"; }}
            >
              <SpeedIcon /> {speed}x
            </button>
            {showSpeedMenu && (
              <div style={{
                position: "absolute", bottom: "100%", right: 0, marginBottom: 8,
                background: "rgba(20,20,20,0.95)", borderRadius: 8, padding: "6px 0",
                minWidth: 80, backdropFilter: "blur(8px)",
              }}>
                {speeds.map((s) => (
                  <button key={s} data-no-propagate
                    onClick={() => { setSpeed(s); setShowSpeedMenu(false); }}
                    style={{
                      display: "block", width: "100%", padding: "6px 16px", border: "none",
                      background: s === speed ? "rgba(255,255,255,0.15)" : "none",
                      color: s === speed ? "#e53935" : controlColor, cursor: "pointer",
                      fontSize: 13, textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = s === speed ? "rgba(255,255,255,0.15)" : "none")}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PiP */}
          <button data-no-propagate onClick={togglePiP}
            style={{ background: "none", border: "none", color: controlColor, cursor: "pointer", padding: 4, display: "flex", borderRadius: 4 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <PiPIcon />
          </button>

          {/* Fullscreen */}
          <button data-no-propagate onClick={toggleFullscreen}
            style={{ background: "none", border: "none", color: controlColor, cursor: "pointer", padding: 4, display: "flex", borderRadius: 4 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <FullscreenIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main export ── */
export default function VideoPlayer({ src, type, poster, title }: VideoPlayerProps) {
  if (type === "youtube" && src) {
    const videoId = extractYouTubeId(src);
    if (!videoId) return null;
    return <YouTubePlayer videoId={videoId} title={title} />;
  }

  if (type === "upload" && src) {
    return <UploadedVideoPlayer src={src} poster={poster} />;
  }

  return null;
}

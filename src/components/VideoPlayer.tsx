"use client";

import { useEffect, useRef } from "react";

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

/* ── YouTube player ── */
function YouTubePlayer({ videoId, title }: { videoId: string; title?: string }) {
  return (
    <div style={{ marginBottom: "2rem", width: "100%" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "56.25%",
          borderRadius: "1rem",
          border: "1px solid var(--border, #e5e5e5)",
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=0&controls=1`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "1rem",
          }}
          title={title || "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}

/* ── Uploaded video player (Plyr) ── */
function UploadedVideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;
    let plyr: any = null;
    let cancelled = false;

    async function init() {
      if (!document.querySelector('link[href*="plyr.io"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.plyr.io/3.7.8/plyr.css";
        document.head.appendChild(link);
      }
      if (!(window as any).Plyr) {
        await new Promise<void>((resolve) => {
          const existing = document.querySelector('script[src*="plyr.io"]');
          if (existing) {
            const c = setInterval(() => {
              if ((window as any).Plyr) { clearInterval(c); resolve(); }
            }, 50);
            setTimeout(() => { clearInterval(c); resolve(); }, 8000);
            return;
          }
          const s = document.createElement("script");
          s.src = "https://cdn.plyr.io/3.7.8/plyr.polyfilled.js";
          s.onload = () => resolve();
          s.onerror = () => resolve();
          document.body.appendChild(s);
        });
      }
      if (cancelled || !videoRef.current) return;
      const Plyr = (window as any).Plyr;
      if (!Plyr) return;
      plyr = new Plyr(videoRef.current, {
        controls: [
          "play-large", "restart", "rewind", "play", "fast-forward",
          "progress", "current-time", "duration",
          "mute", "volume", "settings", "pip", "fullscreen",
        ],
        settings: ["speed", "quality"],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: true },
        invertTime: false,
        displayDuration: true,
        volume: 0.8,
      });
      playerRef.current = plyr;
    }
    init();
    return () => {
      cancelled = true;
      if (plyr && typeof plyr.destroy === "function") plyr.destroy();
      playerRef.current = null;
    };
  }, [src]);

  return (
    <div
      style={{
        marginBottom: "2rem",
        borderRadius: "1rem",
        overflow: "hidden",
        border: "1px solid var(--border, #e5e5e5)",
        background: "#000",
      }}
      className="plyr-custom"
    >
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        playsInline
        preload="metadata"
        poster={poster}
      >
        <source src={src} />
      </video>
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

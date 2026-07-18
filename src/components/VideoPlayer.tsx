"use client";

import { useEffect, useRef, useState } from "react";

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

function YouTubePlayer({ videoId, title }: { videoId: string; title?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load YouTube IFrame API
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    let check: ReturnType<typeof setInterval>;
    function waitForAPI() {
      return new Promise<void>((resolve) => {
        if ((window as any).YT && (window as any).YT.Player) {
          resolve();
          return;
        }
        check = setInterval(() => {
          if ((window as any).YT && (window as any).YT.Player) {
            clearInterval(check);
            resolve();
          }
        }, 50);
        setTimeout(() => { clearInterval(check); resolve(); }, 8000);
      });
    }

    let player: any = null;

    waitForAPI().then(() => {
      if (!(window as any).YT || !containerRef.current) return;

      player = new (window as any).YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 1,
          disablekb: 0,
          fs: 1,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 1,
          cc_load_policy: 1,
          cc_lang_pref: "en",
          hl: "en",
          playsinline: 1,
        },
        events: {
          onReady: () => setReady(true),
        },
      });
    });

    return () => {
      if (check) clearInterval(check);
      if (player && typeof player.destroy === "function") {
        player.destroy();
      }
    };
  }, [videoId]);

  return (
    <div className="mb-8">
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          borderRadius: "1rem",
          overflow: "hidden",
        }}
      >
        <div
          ref={containerRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}

function UploadedVideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    let plyr: any = null;
    let cancelled = false;

    async function init() {
      if (!document.querySelector('link[href*="plyr.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.plyr.io/3.7.8/plyr.css";
        document.head.appendChild(link);
      }

      if (!(window as any).Plyr) {
        await new Promise<void>((resolve) => {
          if (document.querySelector('script[src*="plyr"]')) {
            const c = setInterval(() => {
              if ((window as any).Plyr) { clearInterval(c); resolve(); }
            }, 50);
            setTimeout(() => { clearInterval(c); resolve(); }, 5000);
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
    <div className="mb-8 rounded-2xl overflow-hidden border border-border bg-black plyr-custom">
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

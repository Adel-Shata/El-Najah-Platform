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

export default function VideoPlayer({ src, type, poster, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  // YouTube embed
  if (type === "youtube" && src) {
    const videoId = extractYouTubeId(src);
    if (!videoId) return null;
    return (
      <div className="mb-8 aspect-video rounded-2xl overflow-hidden border border-border">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={title || "YouTube video"}
        />
      </div>
    );
  }

  // Uploaded video with Plyr
  useEffect(() => {
    if (type !== "upload" || !src || !videoRef.current) return;

    let plyr: any = null;
    let cancelled = false;

    async function init() {
      // Load Plyr CSS
      if (!document.querySelector('link[href*="plyr.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.plyr.io/3.7.8/plyr.css";
        document.head.appendChild(link);
      }

      // Load Plyr JS
      if (!(window as any).Plyr) {
        await new Promise<void>((resolve, reject) => {
          if (document.querySelector('script[src*="plyr"]')) {
            // Script tag exists, wait for Plyr to load
            const check = setInterval(() => {
              if ((window as any).Plyr) { clearInterval(check); resolve(); }
            }, 50);
            setTimeout(() => { clearInterval(check); resolve(); }, 5000);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://cdn.plyr.io/3.7.8/plyr.polyfilled.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Plyr"));
          document.body.appendChild(script);
        });
      }

      if (cancelled || !videoRef.current) return;

      const Plyr = (window as any).Plyr;
      plyr = new Plyr(videoRef.current, {
        controls: [
          "play-large",
          "restart",
          "rewind",
          "play",
          "fast-forward",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "settings",
          "pip",
          "fullscreen",
        ],
        settings: ["speed", "quality"],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: true },
        invertTime: false,
        displayDuration: true,
        volume: 0.8,
        autopause: true,
        hideControls: true,
        resetOnEnd: false,
        disableContextMenu: false,
        loadSprite: false,
      });
      playerRef.current = plyr;
    }

    init();

    return () => {
      cancelled = true;
      if (plyr && typeof plyr.destroy === "function") {
        plyr.destroy();
      }
      playerRef.current = null;
    };
  }, [src, type]);

  if (type === "upload" && src) {
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

  return null;
}

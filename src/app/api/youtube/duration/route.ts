import { NextRequest, NextResponse } from "next/server";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await res.text();

    // Try to find duration in the page's player config
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
    if (durationMatch) {
      const seconds = parseInt(durationMatch[1], 10);
      return NextResponse.json({
        durationSeconds: seconds,
        durationMinutes: Math.ceil(seconds / 60),
        videoId,
      });
    }

    // Fallback: try approxDurationMs
    const approxMatch = html.match(/"approxDurationMs":"(\d+)"/);
    if (approxMatch) {
      const ms = parseInt(approxMatch[1], 10);
      const seconds = Math.round(ms / 1000);
      return NextResponse.json({
        durationSeconds: seconds,
        durationMinutes: Math.ceil(seconds / 60),
        videoId,
      });
    }

    return NextResponse.json({ error: "Could not detect duration" }, { status: 404 });
  } catch (error) {
    console.error("YouTube fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch video info" }, { status: 500 });
  }
}

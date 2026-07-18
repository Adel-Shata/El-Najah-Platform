import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // "thumbnail" | "video"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);

    if (type === "thumbnail" || isImage) {
      if (!isImage) {
        return NextResponse.json({ error: "Invalid file type. Allowed: JPG, JPEG, PNG, WEBP" }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "File too large. Maximum size: 5MB" }, { status: 400 });
      }
    } else if (type === "video" || isVideo) {
      if (!isVideo) {
        return NextResponse.json({ error: "Invalid file type. Allowed: MP4, WebM, OGG, MOV" }, { status: 400 });
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json({ error: "File too large. Maximum size: 200MB" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const uploadDir = isVideo
      ? path.join(process.cwd(), "public", "uploads", "courses", "videos")
      : path.join(process.cwd(), "public", "uploads", "courses");

    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || (isImage ? "jpg" : "mp4");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = isVideo
      ? `/uploads/courses/videos/${filename}`
      : `/uploads/courses/${filename}`;

    return NextResponse.json({ url, filename, type: isVideo ? "video" : "image" });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

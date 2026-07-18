import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, description, categoryId, difficulty, thumbnail, status, lessons } = body;

  if (!title || !categoryId) {
    return NextResponse.json({ error: "Title and category required" }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      title,
      description,
      categoryId,
      difficulty: difficulty || "MEDIUM",
      thumbnail,
      status: status || "DRAFT",
      lessons: {
        create: lessons?.map((l: any, i: number) => ({
          title: l.title,
          description: l.description || null,
          content: l.content || null,
          durationMinutes: l.durationMinutes || 0,
          order: i,
        })) || [],
      },
    },
    include: { lessons: true },
  });

  return NextResponse.json(course);
}

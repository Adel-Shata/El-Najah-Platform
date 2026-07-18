import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { courseId } = await params;
  const body = await req.json();
  const { title, description, categoryId, difficulty, thumbnail, status, lessons } = body;

  if (!title || !categoryId) {
    return NextResponse.json({ error: "Title and category required" }, { status: 400 });
  }

  // Delete existing lessons and recreate
  await prisma.courseLesson.deleteMany({ where: { courseId } });

  const course = await prisma.course.update({
    where: { id: courseId },
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { courseId } = await params;
  await prisma.course.delete({ where: { id: courseId } });

  return NextResponse.json({ success: true });
}

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface LessonInput {
  id?: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  videoType?: string;
  durationMinutes: number;
  durationSeconds: number;
}

interface CreateCourseInput {
  locale: string;
  title: string;
  description?: string;
  thumbnail?: string;
  status: "DRAFT" | "PUBLISHED";
  lessons: LessonInput[];
}

export async function createCourse(input: CreateCourseInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Forbidden");

  if (!input.title?.trim()) throw new Error("Title is required");

  const course = await prisma.course.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      thumbnail: input.thumbnail || null,
      status: input.status,
    },
  });

  for (let i = 0; i < input.lessons.length; i++) {
    const l = input.lessons[i];
    await prisma.courseLesson.create({
      data: {
        courseId: course.id,
        title: l.title.trim(),
        description: l.description?.trim() || null,
        content: l.content?.trim() || null,
        videoUrl: l.videoUrl || null,
        videoType: l.videoType || null,
        durationMinutes: l.durationMinutes || 0,
        durationSeconds: l.durationSeconds || 0,
        order: i,
      },
    });
  }

  revalidatePath(`/${input.locale}/admin/courses`);
  redirect(`/${input.locale}/admin/courses`);
}

export async function updateCourse(courseId: string, input: CreateCourseInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Forbidden");

  if (!input.title?.trim()) throw new Error("Title is required");

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      thumbnail: input.thumbnail || null,
      status: input.status,
    },
  });

  // Delete existing lessons and recreate
  await prisma.courseLesson.deleteMany({ where: { courseId } });

  for (let i = 0; i < input.lessons.length; i++) {
    const l = input.lessons[i];
    await prisma.courseLesson.create({
      data: {
        courseId,
        title: l.title.trim(),
        description: l.description?.trim() || null,
        content: l.content?.trim() || null,
        videoUrl: l.videoUrl || null,
        videoType: l.videoType || null,
        durationMinutes: l.durationMinutes || 0,
        durationSeconds: l.durationSeconds || 0,
        order: i,
      },
    });
  }

  revalidatePath(`/${input.locale}/admin/courses`);
  redirect(`/${input.locale}/admin/courses`);
}

export async function getCourseForEdit(courseId: string) {
  try {
    return await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: { orderBy: { order: "asc" } },
      },
    });
  } catch {
    return null;
  }
}

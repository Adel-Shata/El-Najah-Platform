"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface QuestionOptionInput {
  text: string;
  isCorrect: boolean;
}

interface QuestionInput {
  type: string;
  text: string;
  explanation?: string;
  points: number;
  options: QuestionOptionInput[];
  image?: string | null;
}

interface CreateExamInput {
  locale: string;
  title: string;
  description?: string;
  durationMinutes: number;
  passingScore: number;
  twoAttemptPrice?: number | null;
  fourAttemptPrice?: number | null;
  status: "DRAFT" | "PUBLISHED";
  enableTimer: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  showScoreImmediately: boolean;
  allowReview: boolean;
  questions: QuestionInput[];
}

export async function createExam(input: CreateExamInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Forbidden");

  if (!input.title?.trim()) throw new Error("Title is required");
  if (input.durationMinutes < 1) throw new Error("Duration must be at least 1 minute");
  if (input.passingScore < 0 || input.passingScore > 100) throw new Error("Passing score must be between 0 and 100");

  const exam = await prisma.exam.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      durationMinutes: input.durationMinutes,
      passingScore: input.passingScore,
      status: input.status,
      shuffleQuestions: input.shuffleQuestions,
      shuffleOptions: input.shuffleOptions,
      showResults: input.showScoreImmediately,
      twoAttemptPrice: input.twoAttemptPrice ?? null,
      fourAttemptPrice: input.fourAttemptPrice ?? null,
      enableTimer: input.enableTimer,
      showCorrectAnswers: input.showCorrectAnswers,
      showScoreImmediately: input.showScoreImmediately,
      allowReview: input.allowReview,
    },
  });

  for (let i = 0; i < input.questions.length; i++) {
    const q = input.questions[i];
    const question = await prisma.question.create({
      data: {
        examId: exam.id,
        type: q.type as any,
        text: q.text.trim(),
        explanation: q.explanation?.trim() || null,
        image: q.image || null,
        points: q.points,
        order: i,
      },
    });

    if (q.options.length > 0) {
      await prisma.questionOption.createMany({
        data: q.options.map((opt, oi) => ({
          questionId: question.id,
          text: opt.text.trim(),
          isCorrect: opt.isCorrect,
          order: oi,
        })),
      });
    }
  }

  revalidatePath(`/${input.locale}/admin/exams`);
  redirect(`/${input.locale}/admin/exams`);
}

export async function getExistingQuestions() {
  try {
    return await prisma.question.findMany({
      include: {
        exam: { select: { title: true } },
        options: { select: { id: true, text: true, isCorrect: true, order: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch {
    return [];
  }
}

export async function getGlobalPrices() {
  try {
    const settings = await prisma.adminSettings.findUnique({
      where: { id: "singleton" },
      select: { twoAttemptPrice: true, fourAttemptPrice: true },
    });
    return settings;
  } catch {
    return null;
  }
}

export async function getExamForEdit(examId: string) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            options: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });
    return exam;
  } catch {
    return null;
  }
}

export async function updateExam(examId: string, input: CreateExamInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Forbidden");

  if (!input.title?.trim()) throw new Error("Title is required");
  if (input.durationMinutes < 1) throw new Error("Duration must be at least 1 minute");
  if (input.passingScore < 0 || input.passingScore > 100) throw new Error("Passing score must be between 0 and 100");

  await prisma.exam.update({
    where: { id: examId },
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      durationMinutes: input.durationMinutes,
      passingScore: input.passingScore,
      status: input.status,
      shuffleQuestions: input.shuffleQuestions,
      shuffleOptions: input.shuffleOptions,
      showResults: input.showScoreImmediately,
      twoAttemptPrice: input.twoAttemptPrice ?? null,
      fourAttemptPrice: input.fourAttemptPrice ?? null,
      enableTimer: input.enableTimer,
      showCorrectAnswers: input.showCorrectAnswers,
      showScoreImmediately: input.showScoreImmediately,
      allowReview: input.allowReview,
    },
  });

  // Delete existing questions and options, then recreate
  const existingQuestionIds = await prisma.question.findMany({
    where: { examId },
    select: { id: true },
  });

  for (const q of existingQuestionIds) {
    await prisma.questionOption.deleteMany({ where: { questionId: q.id } });
  }
  await prisma.question.deleteMany({ where: { examId } });

  // Create new questions
  for (let i = 0; i < input.questions.length; i++) {
    const q = input.questions[i];
    const question = await prisma.question.create({
      data: {
        examId,
        type: q.type as any,
        text: q.text.trim(),
        explanation: q.explanation?.trim() || null,
        image: q.image || null,
        points: q.points,
        order: i,
      },
    });

    if (q.options.length > 0) {
      await prisma.questionOption.createMany({
        data: q.options.map((opt, oi) => ({
          questionId: question.id,
          text: opt.text.trim(),
          isCorrect: opt.isCorrect,
          order: oi,
        })),
      });
    }
  }

  revalidatePath(`/${input.locale}/admin/exams`);
  redirect(`/${input.locale}/admin/exams`);
}

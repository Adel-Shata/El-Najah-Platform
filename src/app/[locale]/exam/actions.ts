"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function startExam(examId: string, locale: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      status: true,
      durationMinutes: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      enableTimer: true,
      maxAttempts: true,
    },
  });

  if (!exam || exam.status !== "PUBLISHED") {
    throw new Error("EXAM_NOT_FOUND");
  }

  const existingAttempt = await prisma.examAttempt.findFirst({
    where: {
      userId: session.user.id,
      examId,
      status: "IN_PROGRESS",
    },
  });

  if (existingAttempt) {
    return { attemptId: existingAttempt.id };
  }

  const completedCount = await prisma.examAttempt.count({
    where: {
      userId: session.user.id,
      examId,
      status: { in: ["SUBMITTED", "GRADED"] },
    },
  });

  if (completedCount >= exam.maxAttempts) {
    throw new Error("MAX_ATTEMPTS");
  }

  const questions = await prisma.question.findMany({
    where: { examId },
    select: { id: true },
  });

  if (questions.length === 0) {
    throw new Error("NO_QUESTIONS");
  }

  const shuffledQuestions = exam.shuffleQuestions
    ? questions.sort(() => Math.random() - 0.5)
    : questions;

  const orderedQuestions = shuffledQuestions.map((q, i) => ({ ...q, order: i }));

  await prisma.$transaction(
    orderedQuestions.map((q) =>
      prisma.question.update({
        where: { id: q.id },
        data: { order: q.order },
      })
    )
  );

  const attempt = await prisma.examAttempt.create({
    data: {
      userId: session.user.id,
      examId,
      status: "IN_PROGRESS",
      timeRemaining: exam.enableTimer ? exam.durationMinutes * 60 : null,
      currentQuestionIndex: 0,
      answers: {},
      flaggedQuestions: "[]",
    },
  });

  return { attemptId: attempt.id };
}

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function getAttemptData(attemptId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: {
            include: {
              options: { orderBy: { order: "asc" } },
            },
            orderBy: { order: "asc" },
          },
        },
      },
      studentAnswers: true,
    },
  });

  if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");

  if (attempt.userId !== session.user.id && !(await isAdmin(session.user.id))) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  return attempt;
}

export async function autoSaveAttempt(
  attemptId: string,
  answers: Record<string, string | string[] | boolean>,
  flaggedQuestions: string[],
  currentQuestionIndex: number,
  timeRemaining: number | null
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      answers: answers as any,
      flaggedQuestions: JSON.stringify(flaggedQuestions),
      currentQuestionIndex,
      timeRemaining,
    },
  });

  return { saved: true };
}

export async function submitExam(
  attemptId: string,
  locale: string,
  currentAnswers?: Record<string, string | string[] | boolean>,
  currentFlagged?: string[],
  currentTimeRemaining?: number
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: {
            include: {
              options: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  if (attempt.userId !== session.user.id && !(await isAdmin(session.user.id))) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  if (attempt.status !== "IN_PROGRESS") {
    return { alreadySubmitted: true };
  }

  // Persist current answers to DB before grading (auto-save may not have fired yet)
  const answersToGrade = currentAnswers ?? (attempt.answers as Record<string, any>) ?? {};
  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      answers: answersToGrade as any,
      flaggedQuestions: currentFlagged ? JSON.stringify(currentFlagged) : undefined,
      timeRemaining: currentTimeRemaining ?? undefined,
    },
  });

  let totalPoints = 0;
  let earnedPoints = 0;

  const studentAnswersData: {
    attemptId: string;
    questionId: string;
    answer: any;
    isCorrect: boolean;
    pointsEarned: number;
  }[] = [];

  for (const question of attempt.exam.questions) {
    totalPoints += question.points;
    const answer = answersToGrade[question.id];

    let isCorrect = false;
    if (answer !== undefined && answer !== "") {
      if (question.type === "MCQ_SINGLE") {
        const correctOption = question.options.find((o) => o.isCorrect);
        isCorrect = correctOption ? answer === correctOption.id : false;
      } else if (question.type === "MCQ_MULTIPLE") {
        const correctIds = question.options
          .filter((o) => o.isCorrect)
          .map((o) => o.id)
          .sort();
        const given = (Array.isArray(answer) ? answer : [answer]).sort();
        isCorrect = JSON.stringify(correctIds) === JSON.stringify(given);
      } else if (question.type === "TRUE_FALSE") {
        const correctOption = question.options.find((o) => o.isCorrect);
        isCorrect = correctOption ? answer === correctOption.id : false;
      } else if (question.type === "SHORT_ANSWER") {
        const correctOption = question.options.find((o) => o.isCorrect);
        isCorrect = correctOption
          ? String(answer).toLowerCase().trim() === correctOption.text.toLowerCase().trim()
          : false;
      } else if (question.type === "NUMERICAL") {
        const correctOption = question.options.find((o) => o.isCorrect);
        if (correctOption) {
          const given = parseFloat(String(answer));
          const correct = parseFloat(correctOption.text);
          isCorrect = !isNaN(given) && !isNaN(correct) && Math.abs(given - correct) < 0.01;
        }
      }
    }

    if (isCorrect) earnedPoints += question.points;

    studentAnswersData.push({
      attemptId,
      questionId: question.id,
      answer: answer ?? "",
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
    });
  }

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = percentage >= attempt.exam.passingScore;

  await prisma.$transaction([
    prisma.studentAnswer.createMany({ data: studentAnswersData }),
    prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        score: earnedPoints,
        totalPoints,
        earnedPoints,
        percentage,
        passed,
        answers: answersToGrade as any,
      },
    }),
  ]);

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/exam/${attempt.examId}`);

  return {
    attemptId,
    score: earnedPoints,
    totalPoints,
    percentage,
    passed,
  };
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ExamAttemptClient } from "./ExamAttemptClient";

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ locale: string; examId: string; attemptId: string }>;
}) {
  const { locale, examId, attemptId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/auth/signin`);

  let attempt: any = null;
  try {
    attempt = await prisma.examAttempt.findUnique({
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
      },
    });
  } catch {
    // attempt stays null
  }

  if (!attempt) notFound();

  if (attempt.userId !== session.user.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") notFound();
  }

  // If already submitted, show results directly
  if (attempt.status !== "IN_PROGRESS") {
    return (
      <ExamAttemptClient
        locale={locale}
        examId={examId}
        attemptId={attemptId}
        examData={{
          id: attempt.exam.id,
          title: attempt.exam.title,
          durationMinutes: attempt.exam.durationMinutes,
          passingScore: attempt.exam.passingScore,
          enableTimer: attempt.exam.enableTimer,
          showCorrectAnswers: attempt.exam.showCorrectAnswers,
          showScoreImmediately: attempt.exam.showScoreImmediately,
          allowReview: attempt.exam.allowReview,
          questions: attempt.exam.questions.map((q: any) => ({
            id: q.id,
            type: q.type,
            text: q.text,
            explanation: q.explanation,
            image: q.image,
            points: q.points,
            options: q.options.map((o: any) => ({
              id: o.id,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          })),
        }}
        attemptData={{
          id: attempt.id,
          status: attempt.status,
          timeRemaining: attempt.timeRemaining ?? attempt.exam.durationMinutes * 60,
          answers: (attempt.answers as Record<string, any>) ?? {},
          flaggedQuestions: JSON.parse(
            typeof attempt.flaggedQuestions === "string"
              ? attempt.flaggedQuestions
              : JSON.stringify(attempt.flaggedQuestions ?? [])
          ),
          currentQuestionIndex: attempt.currentQuestionIndex ?? 0,
          score: attempt.score ?? undefined,
          totalPoints: attempt.totalPoints ?? undefined,
          percentage: attempt.percentage ?? undefined,
          passed: attempt.passed ?? undefined,
          submittedAt: attempt.submittedAt?.toISOString() ?? undefined,
        }}
      />
    );
  }

  return (
    <ExamAttemptClient
      locale={locale}
      examId={examId}
      attemptId={attemptId}
      examData={{
        id: attempt.exam.id,
        title: attempt.exam.title,
        durationMinutes: attempt.exam.durationMinutes,
        passingScore: attempt.exam.passingScore,
        enableTimer: attempt.exam.enableTimer,
        showCorrectAnswers: attempt.exam.showCorrectAnswers,
        showScoreImmediately: attempt.exam.showScoreImmediately,
        allowReview: attempt.exam.allowReview,
        questions: attempt.exam.questions.map((q: any) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          explanation: q.explanation,
          image: q.image,
          points: q.points,
          options: q.options.map((o: any) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        })),
      }}
      attemptData={{
        id: attempt.id,
        status: attempt.status,
        timeRemaining: attempt.timeRemaining ?? attempt.exam.durationMinutes * 60,
        answers: (attempt.answers as Record<string, any>) ?? {},
        flaggedQuestions: JSON.parse(
          typeof attempt.flaggedQuestions === "string"
            ? attempt.flaggedQuestions
            : JSON.stringify(attempt.flaggedQuestions ?? [])
        ),
        currentQuestionIndex: attempt.currentQuestionIndex ?? 0,
      }}
    />
  );
}

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { FadeIn } from "@/components/motion";
import Link from "next/link";
import { ArrowLeft, Clock, HelpCircle, BarChart3, Trophy, Target } from "lucide-react";
import { StartExamButton } from "./StartExamButton";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ locale: string; examId: string }>;
}) {
  const { locale, examId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/auth/signin`);

  const t = await getTranslations({ locale, namespace: "exam.detail" });

  let exam: any = null;
  try {
    exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        category: { select: { name: true } },
        questions: { select: { points: true } },
        _count: { select: { questions: true } },
      },
    });
  } catch {
    // exam stays null
  }

  if (!exam || exam.status !== "PUBLISHED") notFound();

  // Check for in-progress attempt
  let inProgressAttempt: any = null;
  try {
    inProgressAttempt = await prisma.examAttempt.findFirst({
      where: {
        userId: session.user.id,
        examId,
        status: "IN_PROGRESS",
      },
      select: { id: true },
    });
  } catch {
    // ignore
  }

  // Count completed attempts
  let completedAttempts = 0;
  try {
    completedAttempts = await prisma.examAttempt.count({
      where: {
        userId: session.user.id,
        examId,
        status: { in: ["SUBMITTED", "GRADED"] },
      },
    });
  } catch {
    // ignore
  }

  const remainingAttempts = Math.max(0, exam.maxAttempts - completedAttempts);

  const difficultyColors: Record<string, string> = {
    EASY: "bg-emerald-100 text-emerald-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    HARD: "bg-red-100 text-red-700",
  };

  const difficultyLabels: Record<string, string> = {
    EASY: t("difficulty.easy"),
    MEDIUM: t("difficulty.medium"),
    HARD: t("difficulty.hard"),
  };

  // Get past attempts
  let pastAttempts: any[] = [];
  try {
    pastAttempts = await prisma.examAttempt.findMany({
      where: {
        userId: session.user.id,
        examId,
        status: { in: ["SUBMITTED", "GRADED"] },
      },
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: {
        id: true,
        score: true,
        totalPoints: true,
        percentage: true,
        passed: true,
        submittedAt: true,
      },
    });
  } catch {
    // ignore
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-app py-8">
        <FadeIn className="mb-8">
          <Link
            href={`/${locale}/exams`}
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-4"
          >
            <ArrowLeft className="size-4" /> {t("backToExams")}
          </Link>
        </FadeIn>

        <div className="max-w-2xl mx-auto">
          {/* Exam Info Card */}
          <FadeIn>
            <div className="bg-surface rounded-2xl border border-border p-8">
              {/* Category & Difficulty */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                  {exam.category.name}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    difficultyColors[exam.difficulty] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {difficultyLabels[exam.difficulty] || exam.difficulty}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-text mb-3">{exam.title}</h1>

              {/* Description */}
              {exam.description && (
                <p className="text-text-muted leading-relaxed mb-6">{exam.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-bg">
                  <Clock className="size-5 text-primary" />
                  <div>
                    <p className="text-sm text-text-muted">{t("duration")}</p>
                    <p className="font-semibold text-text">{exam.durationMinutes} {t("minutes")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-bg">
                  <HelpCircle className="size-5 text-primary" />
                  <div>
                    <p className="text-sm text-text-muted">{t("questions")}</p>
                    <p className="font-semibold text-text">{exam._count.questions} {t("questionsCount")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-bg">
                  <BarChart3 className="size-5 text-primary" />
                  <div>
                    <p className="text-sm text-text-muted">{t("passingScore")}</p>
                    <p className="font-semibold text-text">{exam.passingScore}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-bg">
                  <Trophy className="size-5 text-primary" />
                  <div>
                    <p className="text-sm text-text-muted">{t("totalPoints")}</p>
                    <p className="font-semibold text-text">
                      {exam.questions?.reduce((sum: number, q: any) => sum + q.points, 0) ?? 0} {t("points")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attempts remaining */}
              {!inProgressAttempt && (
                <div className="mb-6 p-4 rounded-xl bg-bg border border-border">
                  <div className="flex items-center gap-3">
                    <Target className="size-5 text-primary" />
                    <div>
                      <p className="text-sm text-text-muted">{t("attemptsRemaining")}</p>
                      <p className="font-semibold text-text">
                        {remainingAttempts} / {exam.maxAttempts} {t("attemptsLeft")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* In-progress attempt */}
              {inProgressAttempt && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-amber-800 font-medium">{t("inProgress")}</p>
                  <p className="text-amber-600 text-sm mt-1">{t("inProgressMessage")}</p>
                </div>
              )}

              {/* Start / Resume Button */}
              <StartExamButton
                examId={examId}
                locale={locale}
                inProgressAttemptId={inProgressAttempt?.id}
              />
            </div>
          </FadeIn>

          {/* Past Attempts */}
          {pastAttempts.length > 0 && (
            <FadeIn delay={0.1}>
              <div className="mt-6 bg-surface rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold text-text mb-4">{t("pastAttempts")}</h2>
                <div className="space-y-3">
                  {pastAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-bg"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            attempt.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {attempt.passed ? t("passed") : t("failed")}
                        </span>
                        <span className="text-sm text-text">
                          {attempt.score}/{attempt.totalPoints} ({attempt.percentage}%)
                        </span>
                      </div>
                      <span className="text-sm text-text-muted">
                        {attempt.submittedAt
                          ? new Date(attempt.submittedAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}

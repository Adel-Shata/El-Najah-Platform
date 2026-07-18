import { getTranslations } from "next-intl/server";
import { ExamList } from "@/components/dashboard/exam-list";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FadeIn } from "@/components/motion";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="container-app py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text mb-2">
          {t("title")}
        </h1>
        <p className="text-text-muted mb-8">{t("subtitle")}</p>
        <div className="p-8 rounded-2xl bg-surface border border-border text-center">
          <p className="text-text-muted">{t("pleaseLogin")}</p>
        </div>
      </div>
    );
  }

  // Fetch user's completed payments and exam attempts
  let exams: Array<{
    id: string;
    title: string;
    exam: { durationMinutes: number; passingScore: number; maxAttempts: number };
    granted: number;
    used: number;
    remaining: number;
    attempts: Array<{
      id: string;
      status: string;
      percentage: number | null;
      passed: boolean | null;
      startedAt: string;
      submittedAt: string | null;
    }>;
  }> = [];

  try {
    const [, attempts] = await Promise.all([
      prisma.payment.findMany({
        where: { userId, status: "COMPLETED" },
        select: {
          id: true,
          package: true,
          attemptsGranted: true,
          attemptsUsed: true,
          createdAt: true,
        },
      }),
      prisma.examAttempt.findMany({
        where: { userId },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              durationMinutes: true,
              passingScore: true,
              maxAttempts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Build exam data from attempts and payments
    const examMap = new Map<
      string,
      {
        id: string;
        title: string;
        exam: { durationMinutes: number; passingScore: number; maxAttempts: number };
        granted: number;
        used: number;
        remaining: number;
        attempts: Array<{
          id: string;
          status: string;
          percentage: number | null;
          passed: boolean | null;
          startedAt: string;
          submittedAt: string | null;
        }>;
      }
    >();

    // Initialize from attempts
    for (const attempt of attempts) {
      const existing = examMap.get(attempt.exam.id);
      if (existing) {
        existing.used += 1;
        existing.remaining = existing.granted - existing.used;
        existing.attempts.push({
          id: attempt.id,
          status: attempt.status,
          percentage: attempt.percentage,
          passed: attempt.passed,
          startedAt: attempt.createdAt.toISOString(),
          submittedAt: attempt.submittedAt?.toISOString() ?? null,
        });
      } else {
        const granted = 4;
        examMap.set(attempt.exam.id, {
          id: attempt.exam.id,
          title: attempt.exam.title,
          exam: {
            durationMinutes: attempt.exam.durationMinutes,
            passingScore: attempt.exam.passingScore,
            maxAttempts: attempt.exam.maxAttempts,
          },
          granted,
          used: 1,
          remaining: granted - 1,
          attempts: [
            {
              id: attempt.id,
              status: attempt.status,
              percentage: attempt.percentage,
              passed: attempt.passed,
              startedAt: attempt.createdAt.toISOString(),
              submittedAt: attempt.submittedAt?.toISOString() ?? null,
            },
          ],
        });
      }
    }

    exams = Array.from(examMap.values());
  } catch (e) {
    console.error("Dashboard data fetch failed:", e);
  }

  return (
    <div className="container-app py-8">
      <FadeIn className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text mb-2">
          {t("title")}
        </h1>
        <p className="text-text-muted">{t("subtitle")}</p>
      </FadeIn>

      {exams.length > 0 && (
        <FadeIn className="mb-8">
          <StatsCards exams={exams} />
        </FadeIn>
      )}

      <ExamList locale={locale as "en" | "ar"} exams={exams} />
    </div>
  );
}
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { FadeIn } from "@/components/motion";
import {
  Clock,
  HelpCircle,
  BarChart3,
  Trophy,
  ArrowRight,
  Bell,
  BookOpen,
} from "lucide-react";

export default async function ExamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("exams");

  let publishedExams: any[] = [];
  try {
    publishedExams = await prisma.exam.findMany({
      where: { status: "PUBLISHED" },
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    publishedExams = [];
  }

  const globalPrices = await prisma.adminSettings.findUnique({
    where: { id: "singleton" },
    select: { twoAttemptPrice: true, fourAttemptPrice: true },
  });

  return (
    <section className="container-app py-24 md:py-32">
      <FadeIn className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-text">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-text-muted">{t("subtitle")}</p>
      </FadeIn>

      {publishedExams.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="mt-16 max-w-xl p-8 rounded-2xl border border-border bg-surface">
            <div className="inline-flex size-10 items-center justify-center rounded-md bg-bg text-primary">
              <Bell className="size-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-text">{t("comingSoon")}</h2>
            <p className="mt-2 text-text-muted leading-relaxed">{t("body")}</p>
            <button
              type="button"
              className="mt-6 inline-flex items-center justify-center h-10 px-5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              {t("notify")}
            </button>
          </div>
        </FadeIn>
      ) : (
        <FadeIn delay={0.1}>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publishedExams.map((exam) => {
              const twoPrice = exam.twoAttemptPrice ?? globalPrices?.twoAttemptPrice ?? 0;
              const fourPrice = exam.fourAttemptPrice ?? globalPrices?.fourAttemptPrice ?? 0;

              return (
                <div
                  key={exam.id}
                  className="flex flex-col rounded-2xl border border-border bg-surface hover:shadow-lg transition-shadow"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-text leading-snug">
                      {exam.title}
                    </h3>

                    {/* Description */}
                    {exam.description && (
                      <p className="mt-2 text-sm text-text-muted line-clamp-2">
                        {exam.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {exam.durationMinutes} {t("meta.minutes")}
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="size-3.5" />
                        {exam._count.questions} {t("meta.questions")}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="size-3.5" />
                        {exam.passingScore}% {t("meta.toPass")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="size-3.5" />
                        {exam.passingScore}% {t("meta.passing")}
                      </span>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Pricing */}
                    <div className="mt-5 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-text-muted text-xs">{t("pricing.twoAttempts")}</p>
                          <p className="font-semibold text-text">
                            {twoPrice > 0 ? `$${(twoPrice / 100).toFixed(2)}` : t("pricing.free")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-text-muted text-xs">{t("pricing.fourAttempts")}</p>
                          <p className="font-semibold text-text">
                            {fourPrice > 0 ? `$${(fourPrice / 100).toFixed(2)}` : t("pricing.free")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="px-6 pb-6">
                    <a
                      href={`/${locale}/exam/${exam.id}`}
                      className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
                    >
                      <BookOpen className="size-4" />
                      {t("startExam")}
                      <ArrowRight className="size-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeIn>
      )}
    </section>
  );
}

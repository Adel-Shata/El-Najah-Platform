import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { FadeIn } from "@/components/motion";
import { BookOpen, Clock } from "lucide-react";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("courses");

  let courses: any[] = [];
  try {
    courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      include: {
        _count: { select: { lessons: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    courses = [];
  }

  return (
    <section className="container-app py-24 md:py-32">
      <FadeIn className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-text">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-text-muted">{t("subtitle")}</p>
      </FadeIn>

      {courses.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="mt-16 max-w-xl p-8 rounded-2xl border border-border bg-surface">
            <div className="inline-flex size-10 items-center justify-center rounded-md bg-bg text-primary">
              <BookOpen className="size-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-text">{t("comingSoon")}</h2>
            <p className="mt-2 text-text-muted leading-relaxed">{t("body")}</p>
          </div>
        </FadeIn>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => (
            <FadeIn key={course.id} delay={i * 0.05}>
              <div className="p-6 rounded-2xl border border-border bg-surface hover:border-primary/30 transition-colors h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                    <BookOpen className="size-4" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">{course.title}</h3>
                {course.description && (
                  <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-2">{course.description}</p>
                )}
                <div className="mt-auto flex items-center gap-4 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> {course._count.lessons} {t("meta.lessons")}
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      )}
    </section>
  );
}

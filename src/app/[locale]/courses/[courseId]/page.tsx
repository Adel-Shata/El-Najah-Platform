import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { FadeIn } from "@/components/motion";
import { BookOpen, Clock, Play } from "lucide-react";
import Link from "next/link";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("courseDetail");

  let course: any = null;
  try {
    course = await prisma.course.findUnique({
      where: { id: courseId, status: "PUBLISHED" },
      include: {
        lessons: { orderBy: { order: "asc" } },
      },
    });
  } catch {}

  if (!course) {
    return (
      <section className="container-app py-24 md:py-32">
        <FadeIn className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-text">
            {t("notFound")}
          </h1>
          <p className="mt-4 text-lg text-text-muted">{t("notFoundBody")}</p>
          <Link href={`/${locale}/courses`} className="mt-6 inline-flex items-center gap-2 text-primary hover:underline">
            {t("backToCourses")}
          </Link>
        </FadeIn>
      </section>
    );
  }

  const totalSeconds = course.lessons.reduce(
    (sum: number, l: any) => sum + (l.durationSeconds || l.durationMinutes * 60 || 0),
    0
  );
  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <section className="container-app py-24 md:py-32">
      <FadeIn className="max-w-3xl">
        {course.thumbnail && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-border">
            <img src={course.thumbnail} alt={course.title} className="w-full h-auto" />
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-text">
          {course.title}
        </h1>

        {course.description && (
          <p className="mt-4 text-lg text-text-muted leading-relaxed">{course.description}</p>
        )}

        <div className="flex items-center gap-4 mt-4 text-sm text-text-muted">
          <span>{course.lessons.length} {t("meta.lessons")}</span>
          {totalSeconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {formatDuration(totalSeconds)}
            </span>
          )}
        </div>
      </FadeIn>

      {/* Lessons list */}
      <FadeIn delay={0.1} className="mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold text-text mb-4">{t("lessons")}</h2>
        <div className="space-y-2">
          {course.lessons.map((lesson: any, i: number) => {
            const dur = lesson.durationSeconds || lesson.durationMinutes * 60 || 0;
            return (
              <Link
                key={lesson.id}
                href={`/${locale}/courses/${courseId}/lessons/${lesson.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary text-sm font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {lesson.videoUrl ? <Play className="size-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text">{lesson.title}</p>
                  {lesson.description && (
                    <p className="text-sm text-text-muted truncate">{lesson.description}</p>
                  )}
                </div>
                {dur > 0 && (
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="size-3" /> {formatDuration(dur)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </FadeIn>
    </section>
  );
}

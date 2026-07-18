import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { FadeIn } from "@/components/motion";
import Link from "next/link";
import { ArrowLeft, Clock, Play } from "lucide-react";

export default async function LessonViewPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string; lessonId: string }>;
}) {
  const { locale, courseId, lessonId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("lessonView");

  let course: any = null;
  let lesson: any = null;
  let lessonIndex = -1;

  try {
    course = await prisma.course.findUnique({
      where: { id: courseId, status: "PUBLISHED" },
      include: {
        lessons: { orderBy: { order: "asc" } },
      },
    });

    if (course) {
      lessonIndex = course.lessons.findIndex((l: any) => l.id === lessonId);
      if (lessonIndex >= 0) lesson = course.lessons[lessonIndex];
    }
  } catch {}

  if (!course || !lesson) notFound();

  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < course.lessons.length - 1 ? course.lessons[lessonIndex + 1] : null;

  const dur = lesson.durationSeconds || lesson.durationMinutes * 60 || 0;
  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Build YouTube embed URL
  let youtubeEmbed = "";
  if (lesson.videoType === "youtube" && lesson.videoUrl) {
    const match = lesson.videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) youtubeEmbed = `https://www.youtube.com/embed/${match[1]}`;
  }

  return (
    <section className="container-app py-24 md:py-32">
      <FadeIn className="max-w-3xl">
        {/* Breadcrumb */}
        <Link
          href={`/${locale}/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-6"
        >
          <ArrowLeft className="size-4" /> {course.title}
        </Link>

        {/* Video player */}
        {lesson.videoType === "youtube" && youtubeEmbed && (
          <div className="mb-8 aspect-video rounded-2xl overflow-hidden border border-border">
            <iframe
              src={youtubeEmbed}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        )}

        {lesson.videoType === "upload" && lesson.videoUrl && (
          <div className="mb-8 aspect-video rounded-2xl overflow-hidden border border-border bg-black">
            <video
              src={lesson.videoUrl}
              controls
              className="w-full h-full"
              preload="metadata"
            />
          </div>
        )}

        {/* Lesson info */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-primary font-medium">
            {t("lesson")} {lessonIndex + 1} / {course.lessons.length}
          </span>
          {dur > 0 && (
            <span className="text-sm text-text-muted flex items-center gap-1">
              <Clock className="size-3.5" /> {formatDuration(dur)}
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-text mb-4">
          {lesson.title}
        </h1>

        {lesson.description && (
          <p className="text-text-muted leading-relaxed mb-6">{lesson.description}</p>
        )}

        {lesson.content && (
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <h2 className="text-lg font-semibold text-text mb-3">{t("notes")}</h2>
            <div className="text-text-muted leading-relaxed whitespace-pre-wrap">
              {lesson.content}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          {prevLesson ? (
            <Link
              href={`/${locale}/courses/${courseId}/lessons/${prevLesson.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-text-muted hover:bg-bg transition-colors"
            >
              <ArrowLeft className="size-4" /> {prevLesson.title}
            </Link>
          ) : (
            <div />
          )}
          {nextLesson ? (
            <Link
              href={`/${locale}/courses/${courseId}/lessons/${nextLesson.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              {nextLesson.title} <ArrowLeft className="size-4 rotate-180" />
            </Link>
          ) : (
            <Link
              href={`/${locale}/courses/${courseId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              {t("backToCourse")}
            </Link>
          )}
        </div>
      </FadeIn>
    </section>
  );
}

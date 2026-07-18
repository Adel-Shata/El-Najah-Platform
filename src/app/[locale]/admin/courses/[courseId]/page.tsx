import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { FadeIn } from "@/components/motion";
import Link from "next/link";
import { ArrowLeft, Edit, Play, Clock, FileText, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/auth/signin`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "admin.courseDetail" });
  const tForm = await getTranslations({ locale, namespace: "admin.courseForm" });

  let course: any = null;
  try {
    course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: { orderBy: { order: "asc" } },
        _count: { select: { lessons: true } },
      },
    });
  } catch {}

  if (!course) notFound();

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
    <div className="container-app py-8">
      <FadeIn className="mb-8">
        <Link
          href={`/${locale}/admin/courses`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="size-4" /> {t("backToCourses")}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-text">{course.title}</h1>
            {course.description && (
              <p className="text-text-muted mt-1 max-w-2xl">{course.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${course.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                {course.status}
              </span>
              <span>{course._count.lessons} {t("lessons")}</span>
              {totalSeconds > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> {formatDuration(totalSeconds)}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/${locale}/admin/courses/${courseId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Edit className="size-4" /> {t("editCourse")}
          </Link>
        </div>
      </FadeIn>

      {/* Thumbnail */}
      {course.thumbnail && (
        <FadeIn className="mb-6">
          <div className="w-full max-w-md rounded-2xl overflow-hidden border border-border">
            <img src={course.thumbnail} alt={course.title} className="w-full h-auto" />
          </div>
        </FadeIn>
      )}

      {/* Lessons list */}
      <FadeIn>
        <h2 className="text-xl font-semibold text-text mb-4">{t("lessonsList")}</h2>
        {course.lessons.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface border border-border text-center">
            <FileText className="size-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">{t("noLessons")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {course.lessons.map((lesson: any, i: number) => {
              const dur = lesson.durationSeconds || lesson.durationMinutes * 60 || 0;
              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text">{lesson.title}</p>
                    {lesson.description && (
                      <p className="text-sm text-text-muted truncate">{lesson.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    {lesson.videoType === "youtube" && (
                      <span className="flex items-center gap-1"><Play className="size-3" /> YouTube</span>
                    )}
                    {lesson.videoType === "upload" && (
                      <span className="flex items-center gap-1"><Play className="size-3" /> Video</span>
                    )}
                    {dur > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {formatDuration(dur)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FadeIn>
    </div>
  );
}

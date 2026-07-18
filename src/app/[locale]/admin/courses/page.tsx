import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FadeIn } from "@/components/motion";
import Link from "next/link";
import { Plus, Edit, Trash2, BookOpen, Eye, EyeOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/auth/signin`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "admin.coursesPage" });

  async function deleteCourse(id: string) {
    "use server";
    await prisma.course.delete({ where: { id } });
    revalidatePath(`/${locale}/admin/courses`);
  }

  async function toggleStatus(id: string, currentStatus: string) {
    "use server";
    await prisma.course.update({
      where: { id },
      data: { status: currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
    });
    revalidatePath(`/${locale}/admin/courses`);
  }

  let courses: any[] = [];
  try {
    courses = await prisma.course.findMany({
      include: {
        _count: { select: { lessons: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    courses = [];
  }

  return (
    <div className="container-app py-8">
      <FadeIn className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="text-text-muted mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/admin/courses/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="size-4" /> {t("newCourse")}
        </Link>
      </FadeIn>

      <FadeIn>
        <div className="space-y-3">
          {courses.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface border border-border text-center">
              <BookOpen className="size-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">{t("noCourses")}</p>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-text">{course.title}</p>
                    <p className="text-sm text-text-muted">
                      {course._count.lessons} {t("lessonsCount")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    {course.status}
                  </span>
                  <form action={toggleStatus.bind(null, course.id, course.status)}>
                    <button type="submit" className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-bg transition-colors text-text-muted">
                      {course.status === "PUBLISHED" ? t("unpublish") : t("publish")}
                    </button>
                  </form>
                  <Link href={`/${locale}/admin/courses/${course.id}/edit`} className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                    <Edit className="size-4" />
                  </Link>
                  <form action={deleteCourse.bind(null, course.id)}>
                    <button type="submit" className="p-2 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </FadeIn>
    </div>
  );
}

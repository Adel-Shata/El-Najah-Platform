import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { FadeIn } from "@/components/motion";
import { EditCourseForm } from "@/components/admin/EditCourseForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditCoursePage({
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

  const t = await getTranslations({ locale, namespace: "admin.coursesEdit" });

  let course: any = null;

  try {
    course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: { orderBy: { order: "asc" } },
      },
    });
  } catch {
    // keep defaults
  }

  if (!course) notFound();

  return (
    <div className="container-app py-8">
      <FadeIn className="mb-8">
        <Link
          href={`/${locale}/admin/courses`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="size-4" /> {t("backToCourses")}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-text">
          {t("title")}
        </h1>
        <p className="text-text-muted mt-1">
          {t("subtitle")}
        </p>
      </FadeIn>

      <EditCourseForm
        locale={locale as "en" | "ar"}
        course={course}
      />
    </div>
  );
}

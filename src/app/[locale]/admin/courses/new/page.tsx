import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FadeIn } from "@/components/motion";
import { CreateCourseForm } from "@/components/admin/CreateCourseForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewCoursePage({
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

  const t = await getTranslations({ locale, namespace: "admin.coursesNew" });

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

      <CreateCourseForm
        locale={locale as "en" | "ar"}
      />
    </div>
  );
}

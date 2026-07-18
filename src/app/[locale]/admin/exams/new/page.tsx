import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FadeIn } from "@/components/motion";
import { CreateExamForm } from "@/components/admin/CreateExamForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewExamPage({
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

  const t = await getTranslations({ locale, namespace: "admin.examsNew" });

  let categories: any[] = [];
  let globalPrices: { twoAttemptPrice: number; fourAttemptPrice: number } | null = null;
  let existingQuestions: any[] = [];

  try {
    [categories, globalPrices, existingQuestions] = await Promise.all([
      prisma.examCategory.findMany({
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.adminSettings.findUnique({
        where: { id: "singleton" },
        select: { twoAttemptPrice: true, fourAttemptPrice: true },
      }),
      prisma.question.findMany({
        include: {
          exam: { select: { title: true } },
          options: {
            select: { id: true, text: true, isCorrect: true, order: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);
  } catch {
    // keep defaults
  }

  return (
    <div className="container-app py-8">
      <FadeIn className="mb-8">
        <Link
          href={`/${locale}/admin/exams`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="size-4" /> {t("backToExams")}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-text">
          {t("title")}
        </h1>
        <p className="text-text-muted mt-1">
          {t("subtitle")}
        </p>
      </FadeIn>

      <CreateExamForm
        locale={locale as "en" | "ar"}
        categories={categories}
        globalPrices={globalPrices}
        existingQuestions={existingQuestions}
      />
    </div>
  );
}

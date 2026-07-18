import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FadeIn } from "@/components/motion";
import Link from "next/link";
import { Plus, Edit, Trash2, FileText, Eye, EyeOff } from "lucide-react";

export default async function AdminExamsPage({
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

  const t = await getTranslations({ locale, namespace: "admin.examsPage" });

  async function togglePublish(id: string, currentStatus: string) {
    "use server";
    await prisma.exam.update({
      where: { id },
      data: { status: currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
    });
    revalidatePath(`/${locale}/admin/exams`);
  }

  async function deleteExam(id: string) {
    "use server";
    await prisma.exam.delete({ where: { id } });
    revalidatePath(`/${locale}/admin/exams`);
  }

  let exams: any[] = [];
  try {
    exams = await prisma.exam.findMany({
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    exams = [];
  }

  return (
    <div className="container-app py-8">
      <FadeIn className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="text-text-muted mt-1">{t("subtitle")}</p>
        </div>
        <Link href={`/${locale}/admin/exams/new`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors">
          <Plus className="size-4" /> {t("newExam")}
        </Link>
      </FadeIn>

      <FadeIn>
        <div className="space-y-3">
          {exams.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface border border-border text-center">
              <FileText className="size-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">{t("noExams")}</p>
            </div>
          ) : (
            exams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text truncate">{exam.title}</p>
                    <p className="text-sm text-text-muted truncate">
                      {exam.durationMinutes}min · {exam._count.questions} {t("questionsCount")} · {exam._count.attempts} {t("attemptsCount")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${exam.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : exam.status === "DRAFT" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                    {exam.status}
                  </span>
                  <form action={togglePublish.bind(null, exam.id, exam.status)}>
                    <button type="submit" className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors" title={exam.status === "PUBLISHED" ? t("unpublish") : t("publish")}>
                      {exam.status === "PUBLISHED" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </form>
                  <Link href={`/${locale}/admin/exams/${exam.id}/edit`} className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                    <Edit className="size-4" />
                  </Link>
                  <form action={deleteExam.bind(null, exam.id)}>
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

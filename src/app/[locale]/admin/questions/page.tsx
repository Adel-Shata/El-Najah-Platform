import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FadeIn } from "@/components/motion";
import Link from "next/link";
import { Plus, Edit, Trash2, HelpCircle, GripVertical } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminQuestionsPage({
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

  const t = await getTranslations({ locale, namespace: "admin.questionsPage" });

  async function deleteQuestion(id: string) {
    "use server";
    await prisma.question.delete({ where: { id } });
    revalidatePath(`/${locale}/admin/questions`);
  }

  let questions: any[] = [];
  let exams: any[] = [];
  try {
    questions = await prisma.question.findMany({
      include: {
        exam: { select: { title: true } },
        options: { select: { id: true, isCorrect: true } },
        _count: { select: { answers: true } },
      },
      orderBy: [{ exam: { title: "asc" } }, { order: "asc" }],
    });

    exams = await prisma.exam.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch {
    questions = [];
    exams = [];
  }

  return (
    <div className="container-app py-8">
      <FadeIn className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="text-text-muted mt-1">{t("subtitle")}</p>
        </div>
      </FadeIn>

      {/* Filter by exam */}
      <FadeIn className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href={`/${locale}/admin/questions`} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground">{t("all")}</Link>
          {exams.map((exam) => (
            <Link key={exam.id} href={`/${locale}/admin/questions?examId=${exam.id}`} className="px-3 py-1.5 text-sm rounded-lg border border-border text-text-muted hover:bg-bg transition-colors">
              {exam.title}
            </Link>
          ))}
        </div>
      </FadeIn>

      {/* Questions by exam */}
      <FadeIn>
        <div className="space-y-4">
          {exams.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface border border-border text-center">
              <HelpCircle className="size-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted mb-2">{t("noQuestions")}</p>
              <p className="text-sm text-text-muted">{t("noQuestionsDesc")}</p>
            </div>
          ) : (
            exams.map((exam) => {
              const examQuestions = questions.filter((q) => q.exam.title === exam.title);
              if (examQuestions.length === 0) return null;
              return (
                <div key={exam.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="p-4 border-b border-border bg-bg flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-text">{exam.title}</h2>
                    </div>
                    <Link href={`/${locale}/admin/exams/${exam.id}/edit`} className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-surface transition-colors text-text-muted">
                      {t("manageQuestions")}
                    </Link>
                  </div>
                  <div className="divide-y divide-border">
                    {examQuestions.map((q, i) => (
                      <div key={q.id} className="flex items-center justify-between px-4 py-3 hover:bg-bg/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <GripVertical className="size-4 text-text-muted shrink-0" />
                          <span className="text-sm text-text-muted shrink-0 w-6">#{q.order || i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text truncate">{q.text}</p>
                            <p className="text-xs text-text-muted">
                              {t(`typeLabels.${q.type}`)} · {q.points} {t("pts")} · {q.options.length} {t("optionsCount")} · {q._count.answers} {t("answersCount")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Link href={`/${locale}/admin/exams/${q.examId}/edit`} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                            <Edit className="size-4" />
                          </Link>
                          <form action={deleteQuestion.bind(null, q.id)}>
                            <button type="submit" className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="size-4" />
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </FadeIn>
    </div>
  );
}

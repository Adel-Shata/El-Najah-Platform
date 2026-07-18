import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FadeIn } from "@/components/motion";
import { BarChart3, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";

export default async function AdminResultsPage({
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

  const t = await getTranslations({ locale, namespace: "admin.resultsPage" });

  let results: any[] = [];
  try {
    results = await prisma.examAttempt.findMany({
      include: {
        user: { select: { name: true, email: true } },
        exam: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch {
    results = [];
  }

  const stats = {
    total: results.length,
    graded: results.filter((r) => r.status === "GRADED").length,
    passed: results.filter((r) => r.passed === true).length,
    inProgress: results.filter((r) => r.status === "IN_PROGRESS").length,
  };

  return (
    <div className="container-app py-8">
      <FadeIn className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
        <p className="text-text-muted mt-1">{t("subtitle")}</p>
      </FadeIn>

      {/* Stats */}
      <FadeIn className="mb-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { key: "totalAttempts", value: stats.total, icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
            { key: "graded", value: stats.graded, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
            { key: "passed", value: stats.passed, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-100" },
            { key: "inProgress", value: stats.inProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted font-medium">{t(stat.key)}</p>
                  <p className="mt-2 text-3xl font-bold text-text">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`size-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Results Table */}
      <FadeIn>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {results.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="size-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">{t("noResults")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg">
                    <th className="text-left px-4 py-3 font-medium text-text-muted">{t("student")}</th>
                    <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">{t("exam")}</th>
                    <th className="text-center px-4 py-3 font-medium text-text-muted">{t("status")}</th>
                    <th className="text-center px-4 py-3 font-medium text-text-muted">{t("score")}</th>
                    <th className="text-center px-4 py-3 font-medium text-text-muted">{t("result")}</th>
                    <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">{t("date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-bg/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text">{result.user.name || result.user.email}</p>
                        <p className="text-xs text-text-muted md:hidden">{result.exam.title}</p>
                      </td>
                      <td className="px-4 py-3 text-text-muted hidden md:table-cell">{result.exam.title}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.status === "GRADED" ? "bg-emerald-100 text-emerald-700" :
                          result.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                          result.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-text">
                        {result.percentage !== null ? `${Math.round(result.percentage)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {result.passed === true ? (
                          <CheckCircle2 className="size-5 text-emerald-600 mx-auto" />
                        ) : result.passed === false ? (
                          <XCircle className="size-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted hidden lg:table-cell">
                        {format(result.createdAt, "MMM d, yyyy h:mm a")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { FadeIn, StaggerItem } from "@/components/motion";
import {
  Users,
  FileText,
  Award,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format, formatDistance } from "date-fns";
import { ar } from "date-fns/locale";

interface StatItem {
  label: string;
  value: string | number;
  icon: typeof Users;
  color: string;
  bg: string;
  trend?: { value: string; positive: boolean };
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  // Fetch platform stats
  const [
    totalUsers,
    totalExams,
    ,
    ,
    completedAttempts,
    passedAttempts,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.exam.count({ where: { status: "PUBLISHED" } }),
    prisma.examCategory.count({ where: { status: "ACTIVE" } }),
    prisma.examAttempt.count(),
    prisma.examAttempt.count({ where: { status: "GRADED" } }),
    prisma.examAttempt.count({ where: { status: "GRADED", passed: true } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const passRate = completedAttempts > 0
    ? Math.round((passedAttempts / completedAttempts) * 100)
    : 0;

  const stats: StatItem[] = [
    {
      label: t("stats.totalUsers"),
      value: totalUsers,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      trend: { value: "+12%", positive: true },
    },
    {
      label: t("stats.activeExams"),
      value: totalExams,
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      trend: { value: "+5%", positive: true },
    },
    {
      label: t("stats.passRate"),
      value: `${passRate}%`,
      icon: Award,
      color: "text-amber-600",
      bg: "bg-amber-100",
      trend: { value: "+2.3%", positive: true },
    },
    {
      label: t("stats.revenue"),
      value: `$${(totalRevenue._sum.amount || 0) / 100}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-100",
      trend: { value: "+8%", positive: true },
    },
  ];

  // Recent activity
  const recentAttempts = await prisma.examAttempt.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      exam: { select: { title: true } },
    },
  });

  const recentUsers = await prisma.user.findMany({
    take: 5,
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <div className="container-app py-8">
      <FadeIn className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text mb-2">
          {t("dashboard")}
        </h1>
        <p className="text-text-muted">{t("dashboardSubtitle")}</p>
      </FadeIn>

      {/* Stats Grid */}
      <FadeIn className="mb-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <StaggerItem key={i}>
              <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted font-medium">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold {stat.color}">{stat.value}</p>
                    {stat.trend && (
                      <p className="mt-1 text-sm font-medium flex items-center gap-1">
                        {stat.trend.positive ? (
                          <ArrowUpRight className="size-4 text-emerald-600" aria-hidden="true" />
                        ) : (
                          <ArrowDownRight className="size-4 text-red-600" aria-hidden="true" />
                        )}
                        <span className={stat.trend.positive ? "text-emerald-600" : "text-red-600"}>
                          {stat.trend.value}
                        </span>
                        <span className="text-text-muted">{t("vsLastMonth")}</span>
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className="size-6" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </div>
      </FadeIn>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <FadeIn>
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <h2 className="text-xl font-semibold text-text mb-4">{t("quickActions")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={`/${locale}/admin/categories/new`}
                className="p-4 rounded-xl border border-border bg-bg hover:bg-bg/80 hover:border-primary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-text">{t("actions.newCategory")}</p>
                    <p className="text-sm text-text-muted">{t("actions.newCategoryDesc")}</p>
                  </div>
                </div>
              </a>
              <a
                href={`/${locale}/admin/exams/new`}
                className="p-4 rounded-xl border border-border bg-bg hover:bg-bg/80 hover:border-primary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald/10 text-emerald-600">
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-text">{t("actions.newExam")}</p>
                    <p className="text-sm text-text-muted">{t("actions.newExamDesc")}</p>
                  </div>
                </div>
              </a>
              <a
                href={`/${locale}/admin/questions/new`}
                className="p-4 rounded-xl border border-border bg-bg hover:bg-bg/80 hover:border-primary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue/10 text-blue-600">
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.5-3.146 2.5-1.32 0-2.682-.863-3.272-1.5h-.032" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-text">{t("actions.newQuestion")}</p>
                    <p className="text-sm text-text-muted">{t("actions.newQuestionDesc")}</p>
                  </div>
                </div>
              </a>
              <a
                href={`/${locale}/admin/settings`}
                className="p-4 rounded-xl border border-border bg-bg hover:bg-bg/80 hover:border-primary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber/10 text-amber-600">
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 011.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 01-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 01-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 01-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 011.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-text">{t("actions.settings")}</p>
                    <p className="text-sm text-text-muted">{t("actions.settingsDesc")}</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </FadeIn>

{/* Recent Activity */}
        <FadeIn delay={0.1}>
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text">{t("recentActivity")}</h2>
              <a href={`/${locale}/admin/results`} className="text-sm text-primary hover:text-primary-hover">
                {t("viewAll")}
              </a>
            </div>
            <div className="space-y-3">
              {recentAttempts.length === 0 ? (
                <p className="text-text-muted text-center py-8">{t("noActivity")}</p>
              ) : (
                recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg bg-bg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text">{attempt.user.name || attempt.user.email}</p>
                        <p className="text-sm text-text-muted">
                          {attempt.exam.title} • {formatDistance(attempt.createdAt, new Date(), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {attempt.status === "GRADED" ? "Graded" : attempt.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Recent Users */}
      <div className="mt-6 p-6 rounded-2xl border border-border bg-surface">
        <FadeIn>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text">{t("newStudents")}</h2>
            <a href={`/${locale}/admin/students`} className="text-sm text-primary hover:text-primary-hover">
              {t("viewAll")}
            </a>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-text-muted text-center py-8">{t("noNewStudents")}</p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-bg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-text">{user.name || user.email}</p>
                      <p className="text-sm text-text-muted">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-sm text-text-muted">
                    {format(user.createdAt, "PPP", { locale: locale === "ar" ? ar : undefined })}
                  </span>
                </div>
              ))
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
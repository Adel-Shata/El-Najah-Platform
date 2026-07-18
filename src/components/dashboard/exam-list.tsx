"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  ChevronDown,
  Clock,
  Flag,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion";
import { useTranslations } from "next-intl";

interface Attempt {
  id: string;
  status: string;
  percentage: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
}

interface Exam {
  id: string;
  title: string;
  exam: {
    durationMinutes: number;
    passingScore: number;
    maxAttempts: number;
  };
  granted: number;
  used: number;
  remaining: number;
  attempts: Attempt[];
}

interface ExamListProps {
  locale: "en" | "ar";
  exams: Exam[];
}

export function ExamList({ locale, exams }: ExamListProps) {
  const t = useTranslations("dashboard");
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  const getStatusInfo = (status: string) => {
    const labels: Record<string, { en: string; ar: string; color: string; icon: typeof Clock | typeof CheckCircle2 | typeof AlertCircle }> = {
      IN_PROGRESS: { en: "In Progress", ar: "قيد التقدم", color: "text-amber-600 bg-amber-100", icon: Clock },
      SUBMITTED: { en: "Submitted", ar: "مُرسلة", color: "text-blue-600 bg-blue-100", icon: Clock },
      GRADED: { en: "Graded", ar: "مُصححة", color: "text-emerald-600 bg-emerald-100", icon: CheckCircle2 },
      EXPIRED: { en: "Expired", ar: "منتهية", color: "text-red-600 bg-red-100", icon: AlertCircle },
    };
    return labels[status] || { en: status, ar: status, color: "text-text-muted bg-bg", icon: Clock };
  };

  if (exams.length === 0) {
    return (
      <section>
        <FadeIn>
          <h2 className="text-2xl font-semibold text-text mb-6">{t("purchasedExams")}</h2>
        </FadeIn>
        <div className="p-12 rounded-2xl bg-surface border border-border text-center">
          <p className="text-text-muted mb-4">{t("noExamsPurchased")}</p>
          <p className="text-sm text-text-muted">{t("browseExamsToStart")}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <FadeIn>
        <h2 className="text-2xl font-semibold text-text mb-6">{t("purchasedExams")}</h2>
      </FadeIn>

      <StaggerGroup className="space-y-4">
        {exams.map((exam) => {
          const expanded = expandedExam === exam.id;

          return (
            <StaggerItem key={exam.id}>
              <FadeIn>
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedExam(expanded ? null : exam.id)}
                    className="w-full p-5 gap-4 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-start"
                    aria-expanded={expanded}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-text truncate">{exam.title}</h3>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-text-muted shrink-0">
                      <span className="flex items-center gap-1">
                        <Clock className="size-4" />
                        {exam.exam.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Flag className="size-4" />
                        {exam.exam.passingScore}% pass
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
                        <p className="text-2xl font-bold">{exam.granted - exam.used}</p>
                        <p className="text-xs text-primary/80">{t("attemptsLeft")}</p>
                      </div>
                      <ChevronDown className={`size-5 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-border bg-bg p-5 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div className="p-4 rounded-xl bg-surface border border-border text-center">
                          <p className="text-3xl font-bold text-text">{exam.attempts.filter((a) => a.status === "GRADED").length > 0 ? Math.round(exam.attempts.filter((a) => a.status === "GRADED").reduce((sum, a) => sum + (a.percentage || 0), 0) / exam.attempts.filter((a) => a.status === "GRADED").length) : 0}%</p>
                          <p className="text-sm text-text-muted mt-1">{t("avgScore")}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface border border-border text-center">
                          <p className="text-3xl font-bold text-text">{exam.attempts.filter((a) => a.status === "GRADED").length}</p>
                          <p className="text-sm text-text-muted mt-1">{t("attemptsCompleted")}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface border border-border text-center">
                          <p className="text-3xl font-bold text-text">{exam.granted}</p>
                          <p className="text-sm text-text-muted mt-1">{t("totalPurchased")}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-text mb-3">{t("attemptHistory")}</h4>
                        <div className="space-y-2">
                          {exam.attempts.map((attempt) => {
                            const statusInfo = getStatusInfo(attempt.status);
                            const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt) : null;

                            return (
                              <div key={attempt.id} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                                <div className="flex items-center gap-3">
                                  <div className={cn("inline-flex items-center justify-center size-8 rounded-full bg-bg", statusInfo.color.replace("text-", "text-").replace("bg-", "bg-"))}>
                                    <statusInfo.icon className="size-5" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-text">
                                      {locale === "ar" ? statusInfo.ar : statusInfo.en}
                                    </p>
                                    <p className="text-sm text-text-muted">
                                      {t("started")} {format(submittedAt || new Date(attempt.startedAt), "PPP p", { locale: locale === "ar" ? ar : undefined })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  {attempt.status === "GRADED" && attempt.percentage !== null && (
                                    <span
                                      className={cn(
                                        "px-3 py-1 rounded-full text-sm font-medium",
                                        (attempt.percentage || 0) >= 60
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-red-100 text-red-700"
                                      )}
                                    >
                                      {attempt.percentage}% {attempt.passed ? "✓" : "✗"}
                                    </span>
                                  )}
                                  {attempt.status === "IN_PROGRESS" && (
                                    <a
                                      href={`/${locale}/exam/${exam.id}/attempt/attempt-1`}
                                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
                                    >
                                      {t("continue")}
                                    </a>
                                  )}
                                  {attempt.status === "GRADED" && (
                                    <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-bg transition-colors">
                                      <Download className="size-4 inline-block mr-1" />
                                      {t("downloadReport")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </FadeIn>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getStatusInfo(status: string) {
  const labels: Record<string, { en: string; ar: string; color: string; icon: typeof Clock | typeof CheckCircle2 | typeof AlertCircle }> = {
    IN_PROGRESS: { en: "In Progress", ar: "قيد التقدم", color: "text-amber-600 bg-amber-100", icon: Clock },
    SUBMITTED: { en: "Submitted", ar: "مُرسلة", color: "text-blue-600 bg-blue-100", icon: Clock },
    GRADED: { en: "Graded", ar: "مُصححة", color: "text-emerald-600 bg-emerald-100", icon: CheckCircle2 },
    EXPIRED: { en: "Expired", ar: "منتهية", color: "text-red-600 bg-red-100", icon: AlertCircle },
  };
  return labels[status] || { en: status, ar: status, color: "text-text-muted bg-bg", icon: Clock };
}
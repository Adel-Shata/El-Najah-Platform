"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Download, CheckCircle2, XCircle } from "lucide-react";
import { QuestionResult } from "@/components/exam/QuestionResult";

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionData {
  id: string;
  type: string;
  text: string;
  explanation: string | null;
  image: string | null;
  points: number;
  options: QuestionOption[];
}

interface ExamData {
  id: string;
  title: string;
  durationMinutes: number;
  passingScore: number;
  questions: QuestionData[];
}

interface AttemptData {
  id: string;
  status: string;
  answers: Record<string, string | string[] | boolean>;
  flaggedQuestions: string[];
  currentQuestionIndex: number;
  score?: number;
  totalPoints?: number;
  percentage?: number;
  passed?: boolean;
}

interface ExamResultsProps {
  exam: ExamData;
  attempt: AttemptData;
  locale: string;
}

export function ExamResults({ exam, attempt, locale }: ExamResultsProps) {
  const t = useTranslations("exam");
  const router = useRouter();
  const percentage = attempt.percentage ?? 0;
  const score = attempt.score ?? 0;
  const totalPoints = attempt.totalPoints ?? 0;
  const passed = attempt.passed ?? false;
  const answers = attempt.answers ?? {};

  const answeredCount = Object.keys(answers).filter((k) => {
    const v = answers[k];
    return v !== undefined && v !== "" && v !== null;
  }).length;

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`/api/exam/${exam.id}/attempt/${attempt.id}/report`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Report download failed:", response.status, errorData);
        alert(t("reportDownloadFailed"));
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exam-report-${attempt.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error("Failed to download report:", error);
      alert(t("reportDownloadFailed"));
    }
  };

  // Build questions with correctAnswer from options for QuestionResult
  const questionsWithCorrect = exam.questions.map((q) => ({
    id: q.id,
    type: q.type as "MCQ_SINGLE" | "MCQ_MULTIPLE" | "TRUE_FALSE" | "SHORT_ANSWER" | "NUMERICAL",
    text: q.text,
    explanation: q.explanation ?? undefined,
    image: q.image ?? undefined,
    points: q.points,
    options: q.options,
    correctAnswer:
      q.type === "MCQ_SINGLE" || q.type === "TRUE_FALSE"
        ? q.options.find((o) => o.isCorrect)?.id
        : q.type === "MCQ_MULTIPLE"
        ? q.options.filter((o) => o.isCorrect).map((o) => o.id)
        : q.type === "SHORT_ANSWER" || q.type === "NUMERICAL"
        ? q.options.find((o) => o.isCorrect)?.text
        : undefined,
  }));

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="container-app h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text">{exam.title}</h1>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {passed ? t("passed") : t("failed")}
            </span>
          </div>
        </div>
      </header>

      <div className="container-app py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-text mb-2">{t("examResults")}</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-5 rounded-2xl bg-surface border border-border text-center">
              <p className="text-3xl font-bold text-primary">{percentage}%</p>
              <p className="text-sm text-text-muted mt-1">{t("totalScore")}</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border text-center">
              <p className="text-3xl font-bold text-text">{score}/{totalPoints}</p>
              <p className="text-sm text-text-muted mt-1">{t("pointsEarned")}</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border text-center">
              <p className="text-3xl font-bold text-text">{exam.questions.length}</p>
              <p className="text-sm text-text-muted mt-1">{t("totalQuestions")}</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border text-center">
              <p className="text-3xl font-bold text-emerald-600">{answeredCount}</p>
              <p className="text-sm text-text-muted mt-1">{t("answered")}</p>
            </div>
          </div>
        </div>

        {/* Question review */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text">{t("questionReview")}</h3>
          {questionsWithCorrect.map((q) => (
            <QuestionResult
              key={q.id}
              q={q}
              answer={answers[q.id]}
              locale={locale}
              t={t}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleDownloadReport}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-surface text-text hover:bg-bg transition-colors"
          >
            <Download className="size-5" />
            {t("downloadReport")}
          </button>
          <button
            onClick={() => window.location.href = `/${locale}/dashboard`}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            {t("backToDashboard")}
          </button>
        </div>
      </div>
    </div>
  );
}

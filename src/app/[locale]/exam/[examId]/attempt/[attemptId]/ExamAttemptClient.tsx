"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Flag, AlertCircle, CheckCircle2, Clock, X } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";
import { ExamResults } from "./ExamResults";
import { submitExam, autoSaveAttempt } from "../../../actions";

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
  enableTimer: boolean;
  showCorrectAnswers: boolean;
  showScoreImmediately: boolean;
  allowReview: boolean;
  questions: QuestionData[];
}

interface AttemptData {
  id: string;
  status: string;
  timeRemaining: number;
  answers: Record<string, string | string[] | boolean>;
  flaggedQuestions: string[];
  currentQuestionIndex: number;
  score?: number;
  totalPoints?: number;
  percentage?: number;
  passed?: boolean;
  submittedAt?: string;
}

interface ExamAttemptClientProps {
  locale: string;
  examId: string;
  attemptId: string;
  examData: ExamData;
  attemptData: AttemptData;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ExamAttemptClient({
  locale,
  examId,
  attemptId,
  examData,
  attemptData,
}: ExamAttemptClientProps) {
  const router = useRouter();
  const t = useTranslations("exam");

  const [exam] = useState<ExamData>(examData);
  const [attempt, setAttempt] = useState<AttemptData>(attemptData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "pending">("saved");
  const [showResults, setShowResults] = useState(attemptData.status !== "IN_PROGRESS");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingRef = useRef(attempt.timeRemaining);
  timeRemainingRef.current = attempt.timeRemaining;

  // Auto-save with debounce - only re-trigger on answer/navigation/flag changes, NOT timeRemaining
  useEffect(() => {
    if (attempt.status !== "IN_PROGRESS") return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);

    setAutoSaveStatus("pending");

    autoSaveRef.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        await autoSaveAttempt(
          attemptId,
          attempt.answers,
          attempt.flaggedQuestions,
          attempt.currentQuestionIndex,
          timeRemainingRef.current
        );
        setAutoSaveStatus("saved");
      } catch {
        setAutoSaveStatus("pending");
      }
    }, 3000);

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [attempt.answers, attempt.flaggedQuestions, attempt.currentQuestionIndex, attempt.status, attemptId]);

  // Timer countdown
  useEffect(() => {
    if (!exam.enableTimer || attempt.status !== "IN_PROGRESS") return;

    timerRef.current = setInterval(() => {
      const newTime = timeRemainingRef.current - 1;
      if (newTime <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setAttempt((prev) => ({ ...prev, timeRemaining: 0 }));
        handleSubmit();
        return;
      }
      setAttempt((prev) => ({ ...prev, timeRemaining: newTime }));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exam.enableTimer, attempt.status]);

  const currentQuestion = exam.questions[attempt.currentQuestionIndex];
  const progress = ((attempt.currentQuestionIndex + 1) / exam.questions.length) * 100;
  const answeredCount = Object.keys(attempt.answers).length;

  const handleAnswerChange = (questionId: string, answer: string | string[] | boolean) => {
    setAttempt((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }));
  };

  const toggleFlag = (questionId: string) => {
    setAttempt((prev) => ({
      ...prev,
      flaggedQuestions: prev.flaggedQuestions.includes(questionId)
        ? prev.flaggedQuestions.filter((id) => id !== questionId)
        : [...prev.flaggedQuestions, questionId],
    }));
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < exam.questions.length) {
      setAttempt((prev) => ({ ...prev, currentQuestionIndex: index }));
    }
  };

  const goNext = () => {
    if (attempt.currentQuestionIndex < exam.questions.length - 1) {
      goToQuestion(attempt.currentQuestionIndex + 1);
    }
  };

  const goPrevious = () => {
    if (attempt.currentQuestionIndex > 0) {
      goToQuestion(attempt.currentQuestionIndex - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    setShowConfirmSubmit(false);
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const result = await submitExam(
        attemptId,
        locale,
        attempt.answers,
        attempt.flaggedQuestions,
        timeRemainingRef.current
      );

      if (result.alreadySubmitted) {
        setShowResults(true);
        setIsSubmitting(false);
        return;
      }

      setAttempt((prev) => ({
        ...prev,
        status: "SUBMITTED",
        score: result.score,
        totalPoints: result.totalPoints,
        percentage: result.percentage,
        passed: result.passed,
      }));

      setShowResults(true);
    } catch (err) {
      console.error("Failed to submit exam:", err);
      setIsSubmitting(false);
    }
  }, [attemptId, locale, attempt.answers, attempt.flaggedQuestions]);

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const q = currentQuestion;
    const answer = attempt.answers[q.id];

    switch (q.type) {
      case "MCQ_SINGLE":
        return (
          <div className="space-y-3">
            {q.options?.map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 bg-surface hover:bg-bg transition-colors cursor-pointer",
                  answer === opt.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={opt.id}
                  checked={answer === opt.id}
                  onChange={() => handleAnswerChange(q.id, opt.id)}
                  className="size-5 text-primary border-border focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-text">{opt.text}</span>
              </label>
            ))}
          </div>
        );

      case "MCQ_MULTIPLE":
        return (
          <div className="space-y-3">
            {q.options?.map((opt) => {
              const isChecked = Array.isArray(answer) && answer.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 bg-surface hover:bg-bg transition-colors cursor-pointer",
                    isChecked
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <input
                    type="checkbox"
                    value={opt.id}
                    checked={isChecked}
                    onChange={() => {
                      const current = (answer as string[]) || [];
                      const updated = isChecked
                        ? current.filter((id) => id !== opt.id)
                        : [...current, opt.id];
                      handleAnswerChange(q.id, updated);
                    }}
                    className="size-5 text-primary border-border rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-text">{opt.text}</span>
                </label>
              );
            })}
          </div>
        );

      case "TRUE_FALSE":
        return (
          <div className="grid grid-cols-2 gap-3">
            {q.options?.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAnswerChange(q.id, opt.id)}
                className={cn(
                  "py-4 px-6 rounded-xl font-medium border-2 transition-colors",
                  answer === opt.id
                    ? opt.text.toLowerCase() === "true"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                      : "bg-red-100 text-red-700 border-red-300"
                    : "border-border bg-surface hover:bg-bg"
                )}
              >
                {opt.text}
              </button>
            ))}
          </div>
        );

      case "SHORT_ANSWER":
        return (
          <input
            type="text"
            value={(answer as string) || ""}
            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            placeholder={t("shortAnswerPlaceholder")}
            className="w-full h-12 px-4 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        );

      case "NUMERICAL":
        return (
          <input
            type="number"
            step="any"
            value={(answer as string) || ""}
            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            placeholder={t("numericalPlaceholder")}
            className="w-full h-12 px-4 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        );

      default:
        return <div className="text-text-muted">{t("questionTypeNotSupported")}</div>;
    }
  };

  if (showResults) {
    return (
      <ExamResults
        exam={exam}
        attempt={attempt}
        locale={locale}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header with timer */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="container-app h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-text truncate max-w-xs">
              {exam.title}
            </h1>
            <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
              {t("question")} {attempt.currentQuestionIndex + 1} / {exam.questions.length}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {exam.enableTimer && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold",
                attempt.timeRemaining < 300 ? "bg-red-100 text-red-700 animate-pulse" : "bg-primary/10 text-primary"
              )}>
                <Clock className="size-5" />
                <span>{formatTime(attempt.timeRemaining)}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">{t("progress")}</span>
              <div className="w-40 h-2 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-text-muted w-10 text-right">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {/* Question palette */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text">{t("questionPalette")}</span>
            <span className="text-sm text-text-muted">
              {answeredCount}/{exam.questions.length} {t("answered")}
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {exam.questions.map((q, i) => {
              const answer = attempt.answers[q.id];
              const isFlagged = attempt.flaggedQuestions.includes(q.id);
              const isCurrent = i === attempt.currentQuestionIndex;
              const hasAnswer = answer !== undefined && answer !== "";

              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(i)}
                  className={cn(
                    "flex h-10 w-10 min-w-[40px] items-center justify-center rounded-lg text-sm font-medium transition-all flex-shrink-0 relative",
                    isCurrent && "ring-2 ring-primary bg-primary text-primary-foreground",
                    hasAnswer && !isCurrent && "bg-emerald-100 text-emerald-700",
                    isFlagged && !hasAnswer && !isCurrent && "bg-amber-100 text-amber-700 border-2 border-amber-300",
                    !hasAnswer && !isFlagged && !isCurrent && "bg-surface border border-border text-text-muted hover:bg-bg"
                  )}
                  title={
                    isFlagged ? t("flagged") :
                    hasAnswer ? t("answered") :
                    isCurrent ? t("current") :
                    t("notAnswered")
                  }
                >
                  {i + 1}
                  {isFlagged && <Flag className="absolute -top-1 -right-1 size-3.5 text-amber-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container-app py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Question area */}
          <div className="lg:col-span-8">
            <FadeIn>
              <div className="bg-surface rounded-2xl border border-border p-6">
                {/* Question header */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                      {t(`questionType.${currentQuestion.type.toLowerCase()}`)}
                    </span>
                    <h2 className="text-xl font-semibold text-text">
                      {currentQuestion.text}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleFlag(currentQuestion.id)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        attempt.flaggedQuestions.includes(currentQuestion.id)
                          ? "bg-amber-100 text-amber-700"
                          : "text-text-muted hover:bg-bg"
                      )}
                      title={attempt.flaggedQuestions.includes(currentQuestion.id) ? t("unflag") : t("flag")}
                      aria-label={attempt.flaggedQuestions.includes(currentQuestion.id) ? t("unflag") : t("flag")}
                    >
                      <Flag className="size-5" />
                    </button>
                  </div>
                </div>

                {/* Question content */}
                <div className="space-y-4">
                  {currentQuestion.image && (
                    <div className="flex justify-center">
                      <img
                        src={currentQuestion.image}
                        alt="Question image"
                        className="max-w-full max-h-64 rounded-xl border border-border object-contain"
                      />
                    </div>
                  )}
                  {renderQuestion()}
                </div>

                {/* Navigation */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <button
                    onClick={goPrevious}
                    disabled={attempt.currentQuestionIndex === 0}
                    className="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="size-4" />
                    {t("previous")}
                  </button>

                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    {t("question")} {attempt.currentQuestionIndex + 1} / {exam.questions.length}
                  </div>

                  {attempt.currentQuestionIndex === exam.questions.length - 1 ? (
                    <button
                      onClick={() => setShowConfirmSubmit(true)}
                      disabled={isSubmitting}
                      className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? t("submitting") : t("submitExam")}
                    </button>
                  ) : (
                    <button
                      onClick={goNext}
                      className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center gap-2"
                    >
                      {t("next")}
                      <ChevronRight className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              {/* Timer card */}
              {exam.enableTimer && (
                <FadeIn>
                  <div className={cn(
                    "bg-surface rounded-2xl border border-border p-5",
                    attempt.timeRemaining < 300 && "border-red-200 bg-red-50"
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-text">{t("timeRemaining")}</h3>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        attempt.timeRemaining < 300 ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"
                      )}>
                        {attempt.timeRemaining < 300 ? t("hurry") : t("onTrack")}
                      </span>
                    </div>
                    <div className="text-4xl font-mono font-bold text-center text-text" style={{ fontFamily: "monospace" }}>
                      {formatTime(attempt.timeRemaining)}
                    </div>
                    <div className="mt-3 h-2 bg-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${(attempt.timeRemaining / (exam.durationMinutes * 60)) * 100}%` }}
                      />
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Progress card */}
              <FadeIn delay={0.1}>
                <div className="bg-surface rounded-2xl border border-border p-5">
                  <h3 className="font-semibold text-text mb-3">{t("progress")}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">{t("answered")}</span>
                      <span className="font-medium text-text">{answeredCount} / {exam.questions.length}</span>
                    </div>
                    <div className="h-2 bg-bg rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">{t("flagged")}</span>
                      <span className="font-medium text-amber-700">{attempt.flaggedQuestions.length}</span>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Auto-save status */}
              <FadeIn delay={0.2}>
                <div className="bg-surface rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={cn(
                      "size-2 rounded-full",
                      autoSaveStatus === "saved" && "bg-emerald-500",
                      autoSaveStatus === "saving" && "bg-blue-500 animate-pulse",
                      autoSaveStatus === "pending" && "bg-amber-500"
                    )} />
                    <span className="text-text-muted">
                      {autoSaveStatus === "saved" && t("autoSaved")}
                      {autoSaveStatus === "saving" && t("autoSaving")}
                      {autoSaveStatus === "pending" && t("autoSavePending")}
                    </span>
                  </div>
                </div>
              </FadeIn>

              {/* Actions */}
              <FadeIn delay={0.3}>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.href = `/${locale}/dashboard`}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text hover:bg-bg transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="size-5" />
                    {t("exitExam")}
                  </button>
                  {attempt.currentQuestionIndex === exam.questions.length - 1 && (
                    <button
                      onClick={() => setShowConfirmSubmit(true)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="size-5" />
                      {isSubmitting ? t("submitting") : t("submitExam")}
                    </button>
                  )}
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </main>

      {/* Submit confirmation modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full animate-in slide-in-from-top-4 duration-200">
            <div className="text-center mb-6">
              <AlertCircle className="size-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-text">{t("confirmSubmit")}</h3>
              <p className="text-text-muted mt-2">
                {t("confirmSubmitMessage")}
              </p>
              <div className="mt-3 text-sm text-text-muted">
                <p>{answeredCount} / {exam.questions.length} {t("answered")}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-3 rounded-lg border border-border text-text hover:bg-bg transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t("submitting") : t("confirmSubmit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";

export interface Question {
  id: string;
  type: "MCQ_SINGLE" | "MCQ_MULTIPLE" | "TRUE_FALSE" | "SHORT_ANSWER" | "NUMERICAL";
  text: string;
  options?: Array<{ id: string; text: string }>;
  correctAnswer?: string | string[] | boolean;
  explanation?: string;
  points: number;
  image?: string;
}

export interface ExamData {
  id: string;
  title: string;
  durationMinutes: number;
  passingScore: number;
  questions: Question[];
}

export interface AttemptData {
  id: string;
  timeRemaining: number;
  answers: Record<string, string | string[] | boolean>;
  flaggedQuestions: string[];
  currentQuestionIndex: number;
  status?: string;
  score?: number;
  totalPoints?: number;
  percentage?: number;
  passed?: boolean;
}

interface QuestionResultProps {
  q: Question;
  answer: string | string[] | boolean | undefined;
  locale: string;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

function checkAnswer(q: Question, answer: string | string[] | boolean | undefined): boolean {
  if (answer === undefined || answer === "") return false;
  if (q.type === "MCQ_SINGLE") return answer === q.correctAnswer;
  if (q.type === "MCQ_MULTIPLE") {
    const correct = (q.correctAnswer as string[]) || [];
    const given = (answer as string[]).sort();
    return JSON.stringify(correct.sort()) === JSON.stringify(given);
  }
  if (q.type === "TRUE_FALSE") return answer === q.correctAnswer;
  if (q.type === "SHORT_ANSWER") return (answer as string).toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim();
  if (q.type === "NUMERICAL") return Math.abs(parseFloat(answer as string) - parseFloat(q.correctAnswer as string)) < 0.01;
  return false;
}

export function QuestionResult({ q, answer, locale, t }: QuestionResultProps) {
  const isCorrect = checkAnswer(q, answer);
  const Icon = isCorrect ? CheckCircle2 : AlertCircle;

  const renderMCQSingle = () => (
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
            onChange={() => {}}
            className="size-5 text-primary border-border focus:ring-2 focus:ring-primary/20"
          />
            <span className="text-text">{opt.text}</span>
        </label>
      ))}
    </div>
  );

  const renderMCQMultiple = () => (
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
              onChange={() => {}}
              className="size-5 text-primary border-border rounded focus:ring-2 focus:ring-primary/20"
            />
          <span className="text-text">{opt.text}</span>
          </label>
        );
      })}
    </div>
  );

  const renderTrueFalse = () => (
    <div className="grid grid-cols-2 gap-3">
      {[
        { value: true, label: t("true"), color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
        { value: false, label: t("false"), color: "bg-red-100 text-red-700 border-red-300" },
      ].map(({ value, label, color }) => (
        <button
          key={String(value)}
          type="button"
          onClick={() => {}}
          className={cn(
            "py-4 px-6 rounded-xl font-medium border-2 transition-colors",
            answer === value
              ? color
              : "border-border bg-surface hover:bg-bg"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const renderShortAnswer = () => (
    <input
      type="text"
      value={answer as string || ""}
      onChange={() => {}}
      placeholder={t("shortAnswerPlaceholder")}
      className="w-full h-12 px-4 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
    />
  );

  const renderNumerical = () => (
    <input
      type="number"
      step="any"
      value={answer as string || ""}
      onChange={() => {}}
      placeholder={t("numericalPlaceholder")}
      className="w-full h-12 px-4 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
    />
  );

  return (
    <StaggerItem key={q.id}>
      <div className="rounded-2xl border bg-surface p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary mb-2 inline-block">
              {t(`questionType.${q.type.toLowerCase()}`)}
            </span>
            <h3 className="font-medium text-text">{q.text}</h3>
            {"image" in q && q.image && (
              <div className="mt-3 flex justify-center">
                <img
                  src={q.image as string}
                  alt="Question image"
                  className="max-w-full max-h-48 rounded-xl border border-border object-contain"
                />
              </div>
            )}
          </div>
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium", isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
            <Icon className="size-4" />
            {isCorrect ? t("correct") : t("incorrect")}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {q.type === "MCQ_SINGLE" && renderMCQSingle()}
          {q.type === "MCQ_MULTIPLE" && renderMCQMultiple()}
          {q.type === "TRUE_FALSE" && renderTrueFalse()}
          {q.type === "SHORT_ANSWER" && renderShortAnswer()}
          {q.type === "NUMERICAL" && renderNumerical()}

          {q.explanation && (
            <div className="mt-4 p-4 rounded-lg bg-info/5 border border-info/20">
              <div className="flex items-center gap-2 text-sm text-info mb-2">
                <HelpCircle className="size-4" />
                <span className="font-medium">{t("explanation")}</span>
              </div>
              <p className="text-text">{q.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </StaggerItem>
  );
}
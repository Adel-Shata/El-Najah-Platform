"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Loader2, Play, ArrowRight, RotateCcw } from "lucide-react";
import { startExam } from "../actions";

interface StartExamButtonProps {
  examId: string;
  locale: string;
  inProgressAttemptId?: string;
}

export function StartExamButton({ examId, locale, inProgressAttemptId }: StartExamButtonProps) {
  const router = useRouter();
  const t = useTranslations("exam.detail");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await startExam(examId, locale);
      window.location.href = `/${locale}/exam/${examId}/attempt/${result.attemptId}`;
    } catch (err: any) {
      const message = err?.message || "Failed to start exam";
      if (message === "UNAUTHORIZED") {
        window.location.href = `/${locale}/auth/signin`;
      } else if (message === "NO_QUESTIONS") {
        setError(t("noQuestions"));
      } else if (message === "MAX_ATTEMPTS") {
        setError(t("maxAttempts"));
      } else {
        setError(t("startError"));
      }
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            {t("starting")}
          </>
        ) : inProgressAttemptId ? (
          <>
            <RotateCcw className="size-5" />
            {t("resumeExam")}
            <ArrowRight className="size-4" />
          </>
        ) : (
          <>
            <Play className="size-5" />
            {t("startExam")}
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}

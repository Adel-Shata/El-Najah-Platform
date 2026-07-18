"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t("emailRequired"));
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || t("error"));
          return;
        }

        setSuccess(true);
      } catch {
        setError(t("error"));
      }
    });
  }

  if (success) {
    return (
      <FadeIn className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="size-12 text-emerald-500" />
        <p className="text-lg font-medium text-text">{t("successTitle")}</p>
        <p className="text-sm text-text-muted text-center">{t("successMessage")}</p>
      </FadeIn>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <FadeIn className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </FadeIn>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-text">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          disabled={isPending}
          className={cn(
            "w-full h-11 px-4 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition disabled:opacity-50",
            error && "border-danger focus:border-danger focus:ring-danger/20"
          )}
        />
      </div>

      <FadeIn>
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("sending")}
            </>
          ) : (
            t("sendResetLink")
          )}
        </button>
      </FadeIn>
    </form>
  );
}

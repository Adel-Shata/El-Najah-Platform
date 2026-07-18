"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth.resetPassword");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("passwordMinLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordsDontMatch"));
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password, confirmPassword }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || t("error"));
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
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
        <p className="text-sm text-text-muted">Redirecting to sign in...</p>
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
        <label htmlFor="password" className="block text-sm font-medium text-text">
          {t("newPassword")}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            disabled={isPending}
            className={cn(
              "w-full h-11 px-4 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition disabled:opacity-50 pr-12"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text">
          {t("confirmPassword")}
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder={t("confirmPlaceholder")}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
            disabled={isPending}
            className={cn(
              "w-full h-11 px-4 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition disabled:opacity-50 pr-12"
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
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
              {t("resetting")}
            </>
          ) : (
            t("resetPassword")
          )}
        </button>
      </FadeIn>
    </form>
  );
}

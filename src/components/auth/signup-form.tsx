"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";

export function SignUpForm() {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [loginMethod, setLoginMethod] = useState<"email" | "username" | "both">("email");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    fetch("/api/auth/login-method")
      .then((res) => res.json())
      .then((data) => {
        if (data?.loginMethod) {
          setLoginMethod(data.loginMethod);
        }
      })
      .catch(() => {});
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setAttempted(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAttempted(true);

    if (!formData.name.trim()) return;
    if (!formData.email.trim() && (loginMethod === "email" || loginMethod === "both")) return;
    if (!formData.username.trim() && (loginMethod === "username" || loginMethod === "both")) return;
    if (!formData.password) return;
    if (!formData.confirmPassword) return;

    if (formData.password.length < 8) {
      setError(t("passwordMinLength"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordsDontMatch"));
      return;
    }

    const useUsername = loginMethod === "username" || loginMethod === "both";
    const useEmail = loginMethod === "email" || loginMethod === "both";

    if (useUsername && !formData.username.trim()) {
      setError(t("usernameRequired"));
      return;
    }

    if (useEmail && !formData.email.trim()) {
      setError(t("emailTaken"));
      return;
    }

    startTransition(async () => {
      try {
        const emailToSend = useEmail
          ? formData.email
          : `${formData.username}@al-najah.local`;

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: emailToSend,
            username: useUsername ? formData.username : undefined,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const errorKey = data.error as string;
          const errorMessages: Record<string, string> = {
            emailAlreadyExists: t("emailAlreadyExists"),
            usernameAlreadyExists: t("usernameAlreadyExists"),
            registrationFailed: t("registrationFailed"),
            emailTaken: t("emailTaken"),
            usernameRequired: t("usernameRequired"),
          };
          setError(errorMessages[errorKey] || errorKey || t("registrationFailed"));
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/signin");
        }, 1500);
      } catch {
        setError(t("registrationFailed"));
      }
    });
  }

  if (success) {
    return (
      <FadeIn className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="size-12 text-emerald-500" />
        <p className="text-lg font-medium text-text">{t("title")}</p>
        <p className="text-sm text-text-muted">Redirecting to sign in...</p>
      </FadeIn>
    );
  }

  const nameEmpty = attempted && !formData.name.trim();
  const emailEmpty = attempted && !formData.email.trim() && (loginMethod === "email" || loginMethod === "both");
  const usernameEmpty = attempted && !formData.username.trim() && (loginMethod === "username" || loginMethod === "both");
  const passwordEmpty = attempted && !formData.password;
  const confirmEmpty = attempted && !formData.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <FadeIn className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </FadeIn>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium text-text">
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder={t("namePlaceholder")}
          value={formData.name}
          onChange={handleChange}
          disabled={isPending}
          className={cn(
            "w-full h-11 px-4 text-sm rounded-lg border bg-bg text-text placeholder:text-text-muted outline-none transition disabled:opacity-50",
            nameEmpty
              ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
          )}
        />
        {nameEmpty && (
          <p className="text-xs text-danger mt-1">{t("fieldRequired")}</p>
        )}
      </div>

      {/* Identifier fields based on login method */}
      {loginMethod === "both" ? (
        <>
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
              value={formData.email}
              onChange={handleChange}
              disabled={isPending}
              className={cn(
                "w-full h-11 px-4 text-sm rounded-lg border bg-bg text-text placeholder:text-text-muted outline-none transition disabled:opacity-50",
                emailEmpty
                  ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
                  : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              )}
            />
            {emailEmpty && (
              <p className="text-xs text-danger mt-1">{t("fieldRequired")}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-sm font-medium text-text">
              {t("username")}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder={t("usernamePlaceholder")}
              value={formData.username}
              onChange={handleChange}
              disabled={isPending}
              className={cn(
                "w-full h-11 px-4 text-sm rounded-lg border bg-bg text-text placeholder:text-text-muted outline-none transition disabled:opacity-50",
                usernameEmpty
                  ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
                  : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              )}
            />
            {usernameEmpty && (
              <p className="text-xs text-danger mt-1">{t("fieldRequired")}</p>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="identifier" className="block text-sm font-medium text-text">
            {loginMethod === "username" ? t("username") : t("email")}
          </label>
          <input
            id="identifier"
            name={loginMethod === "username" ? "username" : "email"}
            type={loginMethod === "username" ? "text" : "email"}
            autoComplete={loginMethod === "username" ? "username" : "email"}
            required
            placeholder={loginMethod === "username" ? t("usernamePlaceholder") : t("emailPlaceholder")}
            value={loginMethod === "username" ? formData.username : formData.email}
            onChange={(e) => {
              if (loginMethod === "username") {
                setFormData((prev) => ({ ...prev, username: e.target.value }));
              } else {
                setFormData((prev) => ({ ...prev, email: e.target.value }));
              }
              setError(null);
              setAttempted(false);
            }}
            disabled={isPending}
            className={cn(
              "w-full h-11 px-4 text-sm rounded-lg border bg-bg text-text placeholder:text-text-muted outline-none transition disabled:opacity-50",
              (loginMethod === "username" ? usernameEmpty : emailEmpty)
                ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
                : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            )}
          />
          {(loginMethod === "username" ? usernameEmpty : emailEmpty) && (
            <p className="text-xs text-danger mt-1">{t("fieldRequired")}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-text">
          {t("password")}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder={t("passwordPlaceholder")}
            value={formData.password}
            onChange={handleChange}
            disabled={isPending}
            className={cn(
              "w-full h-11 px-4 text-sm rounded-lg border bg-bg text-text placeholder:text-text-muted outline-none transition disabled:opacity-50 pr-12",
              passwordEmpty
                ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
                : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        {passwordEmpty && (
          <p className="text-xs text-danger mt-1">{t("fieldRequired")}</p>
        )}
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
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isPending}
            className={cn(
              "w-full h-11 px-4 text-sm rounded-lg border bg-bg text-text placeholder:text-text-muted outline-none transition disabled:opacity-50 pr-12",
              confirmEmpty
                ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
                : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        {confirmEmpty && (
          <p className="text-xs text-danger mt-1">{t("fieldRequired")}</p>
        )}
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
              {t("creatingAccount")}
            </>
          ) : (
            t("createAccount")
          )}
        </button>
      </FadeIn>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

export function SignInForm() {
  const t = useTranslations("auth.signin");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const [loginType, setLoginType] = useState<"email" | "username">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const locale = (params?.locale as string) || "en";

  function handleIdentifierChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIdentifier(e.target.value);
    setError(null);
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAttempted(true);

    if (!identifier.trim() || !password) {
      return;
    }

    startTransition(async () => {
      const signInData = loginType === "username"
        ? { username: identifier, password }
        : { email: identifier, password };

      const result = await signIn("credentials", {
        ...signInData,
        redirect: false,
      });

      if (result?.error) {
        setError(t("invalidCredentials"));
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  }

  const identifierEmpty = attempted && !identifier.trim();
  const passwordEmpty = attempted && !password;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <FadeIn className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </FadeIn>
      )}

      {/* Login type toggle */}
      <div className="flex rounded-lg border border-border bg-bg p-1">
        <button
          type="button"
          onClick={() => { setLoginType("email"); setIdentifier(""); setError(null); setAttempted(false); }}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-md transition-all",
            loginType === "email"
              ? "bg-surface text-text shadow-sm"
              : "text-text-muted hover:text-text"
          )}
        >
          {t("email")}
        </button>
        <button
          type="button"
          onClick={() => { setLoginType("username"); setIdentifier(""); setError(null); setAttempted(false); }}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-md transition-all",
            loginType === "username"
              ? "bg-surface text-text shadow-sm"
              : "text-text-muted hover:text-text"
          )}
        >
          {t("username")}
        </button>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="identifier" className="block text-sm font-medium text-text">
          {loginType === "email" ? t("email") : t("username")}
        </label>
        <input
          id="identifier"
          name="identifier"
          type={loginType === "email" ? "email" : "text"}
          autoComplete={loginType === "email" ? "email" : "username"}
          required
          placeholder={loginType === "email" ? t("emailPlaceholder") : t("usernamePlaceholder")}
          value={identifier}
          onChange={(e) => { setIdentifier(e.target.value); setError(null); setAttempted(false); }}
          disabled={isPending}
          className={cn(
            "w-full h-11 px-4 text-sm rounded-lg border bg-bg text-text placeholder:text-text-muted outline-none transition disabled:opacity-50",
            identifierEmpty
              ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
          )}
        />
        {identifierEmpty && (
          <p className="text-xs text-danger mt-1">{t("fieldRequired")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-text">
            {t("password")}
          </label>
          <Link href={`/${locale}/auth/forgot-password`} className="text-sm text-primary hover:text-primary-hover transition-colors">
            {t("forgotPassword")}
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); setAttempted(false); }}
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="rememberMe"
            className="size-4 rounded border-border bg-bg text-primary focus:ring-primary/20"
          />
          <span className="text-sm text-text-muted">{t("rememberMe")}</span>
        </label>
      </div>

      <FadeIn>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "w-full h-11 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("signingIn")}
            </>
          ) : (
            t("signIn")
          )}
        </button>
      </FadeIn>
    </form>
  );
}

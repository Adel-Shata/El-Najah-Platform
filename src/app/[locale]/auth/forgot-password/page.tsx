import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FadeIn } from "@/components/motion";

export const metadata = {
  title: "Forgot Password",
  description: "Reset your El-Najah password",
};

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("auth.forgotPassword");

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        <FadeIn className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="mt-2 text-text-muted">{t("subtitle")}</p>
        </FadeIn>

        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <FadeIn delay={0.1}>
            <ForgotPasswordForm />
          </FadeIn>

          <FadeIn delay={0.2} className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              <Link href={`/${locale}/auth/signin`} className="font-medium text-primary hover:text-primary-hover transition-colors">
                {t("backToSignIn")}
              </Link>
            </p>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

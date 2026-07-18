import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FadeIn } from "@/components/motion";

export const metadata = {
  title: "Reset Password",
  description: "Set your new Al-Najah password",
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations("auth.resetPassword");

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        <FadeIn className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="mt-2 text-text-muted">{t("subtitle")}</p>
        </FadeIn>

        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          {token ? (
            <FadeIn delay={0.1}>
              <ResetPasswordForm token={token} />
            </FadeIn>
          ) : (
            <FadeIn className="text-center py-8">
              <p className="text-danger">{t("invalidLink")}</p>
              <Link href={`/${locale}/auth/forgot-password`} className="mt-4 inline-block text-primary hover:text-primary-hover transition-colors">
                {t("requestNewLink")}
              </Link>
            </FadeIn>
          )}

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

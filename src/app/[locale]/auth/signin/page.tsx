import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SignInForm } from "@/components/auth/signin-form";
import { FadeIn } from "@/components/motion";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your El-Najah account",
};

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;
  const t = await getTranslations("auth.signin");

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        <FadeIn className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="mt-2 text-text-muted">{t("subtitle")}</p>
        </FadeIn>

        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <FadeIn delay={0.1}>
            <SignInForm />
          </FadeIn>

          <FadeIn delay={0.2} className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              {t("noAccount")}{" "}
              <Link href={`/${locale}/auth/register${callbackUrl ? `?callbackUrl=${callbackUrl}` : ""}`} className="font-medium text-primary hover:text-primary-hover transition-colors">
                {t("registerLink")}
              </Link>
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.3} className="mt-6 text-center text-sm text-text-muted">
          <p>Demo: admin@el-najah.com / Admin@123456</p>
        </FadeIn>
      </div>
    </div>
  );
}

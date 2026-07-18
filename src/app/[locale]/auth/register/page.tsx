import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/signup-form";
import { FadeIn } from "@/components/motion";

export const metadata = {
  title: "Sign up",
  description: "Create your Al-Najah account",
};

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("auth.register");

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        <FadeIn className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="mt-2 text-text-muted">{t("subtitle")}</p>
        </FadeIn>

        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <FadeIn delay={0.1}>
            <SignUpForm />
          </FadeIn>

          <FadeIn delay={0.2} className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              {t("hasAccount")}{" "}
              <Link href={`/${locale}/auth/signin`} className="font-medium text-primary hover:text-primary-hover transition-colors">
                {t("signInLink")}
              </Link>
            </p>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

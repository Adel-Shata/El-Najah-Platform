import { setRequestLocale, getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";
import { FadeIn } from "@/components/motion";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("courses");

  return (
    <section className="container-app py-24 md:py-32">
      <FadeIn className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-text">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-text-muted">{t("subtitle")}</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="mt-16 max-w-xl p-8 rounded-2xl border border-border bg-surface">
          <div className="inline-flex size-10 items-center justify-center rounded-md bg-bg text-primary">
            <Bell className="size-5" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-text">{t("comingSoon")}</h2>
          <p className="mt-2 text-text-muted leading-relaxed">{t("body")}</p>
          <button
            type="button"
            className="mt-6 inline-flex items-center justify-center h-10 px-5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            {t("notify")}
          </button>
        </div>
      </FadeIn>
    </section>
  );
}

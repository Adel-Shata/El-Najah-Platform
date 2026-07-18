import { setRequestLocale, getTranslations } from "next-intl/server";
import { Target, BarChart3, Heart } from "lucide-react";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion";

const valueKeys = ["focus", "evidence", "respect"] as const;
const icons: Record<(typeof valueKeys)[number], React.ComponentType<{ className?: string }>> = {
  focus: Target,
  evidence: BarChart3,
  respect: Heart,
};

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <>
      <section className="container-app py-24 md:py-32">
        <FadeIn className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-text">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-text-muted">{t("subtitle")}</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-semibold text-text">{t("mission.title")}</h2>
            <p className="mt-4 text-lg text-text-muted leading-relaxed">
              {t("mission.body")}
            </p>
          </div>
        </FadeIn>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="container-app py-24 md:py-32">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text">
              {t("values.title")}
            </h2>
          </FadeIn>

          <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-3">
            {valueKeys.map((key) => {
              const Icon = icons[key];
              return (
                <StaggerItem key={key}>
                  <article className="h-full p-6 rounded-lg border border-border bg-bg">
                    <div className="inline-flex size-10 items-center justify-center rounded-md bg-surface text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-text">
                      {t(`values.items.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm text-text-muted leading-relaxed">
                      {t(`values.items.${key}.body`)}
                    </p>
                  </article>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>
    </>
  );
}

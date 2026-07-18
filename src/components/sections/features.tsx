"use client";

import { useTranslations } from "next-intl";
import { BookOpen, Timer, TrendingUp, Languages } from "lucide-react";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion";

const itemKeys = ["courses", "exams", "tracking", "bilingual"] as const;

const icons: Record<(typeof itemKeys)[number], React.ComponentType<{ className?: string }>> = {
  courses: BookOpen,
  exams: Timer,
  tracking: TrendingUp,
  bilingual: Languages,
};

export function Features() {
  const t = useTranslations("home.features");

  return (
    <section className="container-app py-24 md:py-32">
      <FadeIn className="max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text">
          {t("title")}
        </h2>
        <p className="mt-4 text-lg text-text-muted">{t("subtitle")}</p>
      </FadeIn>

      <StaggerGroup className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {itemKeys.map((key) => {
          const Icon = icons[key];
          return (
            <StaggerItem key={key}>
              <article className="group h-full p-6 rounded-lg border border-border bg-surface hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="inline-flex size-10 items-center justify-center rounded-md bg-bg text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  {t(`items.${key}.body`)}
                </p>
              </article>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </section>
  );
}

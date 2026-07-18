"use client";

import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/motion";

const statKeys = ["students", "courses", "exams", "passRate"] as const;

const values: Record<(typeof statKeys)[number], string> = {
  students: "12K+",
  courses: "180+",
  exams: "1.2M",
  passRate: "94%",
};

export function Stats() {
  const t = useTranslations("home.stats");

  return (
    <section className="border-y border-border bg-surface">
      <div className="container-app py-16 md:py-20">
        <FadeIn>
          <div className="grid gap-8 md:grid-cols-4">
            {statKeys.map((key) => (
              <div key={key} className="text-center md:text-start">
                <p className="text-3xl md:text-4xl font-semibold text-text tracking-tight">
                  {values[key]}
                </p>
                <p className="mt-2 text-sm text-text-muted uppercase tracking-wider">
                  {t(key)}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

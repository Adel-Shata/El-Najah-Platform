"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion";

export function CTA() {
  const t = useTranslations("home.cta");

  return (
    <section className="container-app py-24 md:py-32">
      <FadeIn>
        <div
          className="relative overflow-hidden rounded-2xl border border-border bg-surface p-12 md:p-16 text-center"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 0%, rgba(30,58,138,0.12), transparent 60%)",
            }}
          />
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text max-w-2xl mx-auto">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-text-muted max-w-xl mx-auto">{t("body")}</p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 h-12 px-6 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              {t("button")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  const t = useTranslations("home.hero");
  const ease = [0.4, 0, 0.2, 1] as const;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-bg via-surface to-bg"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(30,58,138,0.08), transparent 50%), radial-gradient(circle at 80% 30%, rgba(217,119,6,0.06), transparent 50%)",
        }}
      />

      <div className="container-app py-24 md:py-32 lg:py-40">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="max-w-3xl"
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
            }}
            className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full border border-border bg-surface text-text-muted"
          >
            <span className="size-1.5 rounded-full bg-accent" />
            {t("eyebrow")}
          </motion.p>

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
            }}
            className="mt-6 text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-text"
          >
            {t("title")}
          </motion.h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
            }}
            className="mt-6 text-lg md:text-xl text-text-muted max-w-2xl leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
            }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/contact"
              className={cn(
                "inline-flex items-center gap-2 h-12 px-6 text-sm font-medium rounded-md",
                "bg-primary text-primary-foreground hover:bg-primary-hover",
                "transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              )}
            >
              {t("primaryCta")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
            <Link
              href="/courses"
              className={cn(
                "inline-flex items-center gap-2 h-12 px-6 text-sm font-medium rounded-md",
                "border border-border bg-surface text-text hover:bg-bg",
                "transition-colors"
              )}
            >
              {t("secondaryCta")}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

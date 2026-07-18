"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Languages } from "lucide-react";

type Locale = "en" | "ar";

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const next: Locale = currentLocale === "en" ? "ar" : "en";
  const label = currentLocale === "en" ? t("arabic") : t("english");

  function switchTo() {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      disabled={isPending}
      className="inline-flex items-center gap-2 h-9 px-3 text-sm rounded-md border border-border bg-surface text-text hover:bg-bg transition-colors disabled:opacity-50"
      aria-label={t("language")}
    >
      <Languages className="size-4" />
      <span>{label}</span>
    </button>
  );
}

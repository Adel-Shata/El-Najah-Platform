"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { LanguageSwitcher } from "./language-switcher";
import { UserMenu, UserMenuMobile } from "./user-menu";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Locale = "en" | "ar";

const navKeys = ["home", "courses", "exams", "about", "contact"] as const;

export function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border bg-surface/80 backdrop-blur-md"
          : "bg-transparent"
      )}
      style={{ height: "var(--header-height)" }}
    >
      <div className="container-app h-full flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-text"
          aria-label={tBrand("name")}
        >
          <Logo className="size-7" />
          <span className="text-lg">{tBrand("name")}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navKeys.map((key) => (
            <Link
              key={key}
              href={`/${key === "home" ? "" : key}`}
              className={cn(
                "px-3 py-2 text-sm rounded-md transition-colors",
                "text-text-muted hover:text-text hover:bg-bg",
                pathname === (key === "home" ? "" : `/${key}`) && "text-text"
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher currentLocale={locale} />
          <UserMenu locale={locale} />
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center size-10 rounded-md text-text hover:bg-bg"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-surface"
          >
            <nav className="container-app py-4 flex flex-col gap-1">
              {navKeys.map((key) => (
                <Link
                  key={key}
                  href={`/${key === "home" ? "" : key}`}
                  onClick={closeMenu}
                  className="px-3 py-3 text-sm rounded-md text-text-muted hover:text-text hover:bg-bg"
                >
                  {t(key)}
                </Link>
              ))}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-border">
                <LanguageSwitcher currentLocale={locale} />
              </div>
              <UserMenuMobile locale={locale} />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path
        d="M9 22V10h2.6l3.4 7.2L18.4 10H21v12h-2v-7.6L16.2 20h-2.4L11 14.4V22H9z"
        fill="var(--primary-foreground)"
      />
    </svg>
  );
}

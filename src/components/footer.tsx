import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface mt-24">
      <div className="container-app py-12 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-semibold text-text">{tBrand("name")}</p>
          <p className="text-sm text-text-muted mt-2 max-w-xs">
            {tBrand("tagline")}
          </p>
        </div>

        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/" className="text-text-muted hover:text-text transition-colors">
            {tNav("home")}
          </Link>
          <Link href="/courses" className="text-text-muted hover:text-text transition-colors">
            {tNav("courses")}
          </Link>
          <Link href="/exams" className="text-text-muted hover:text-text transition-colors">
            {tNav("exams")}
          </Link>
          <Link href="/about" className="text-text-muted hover:text-text transition-colors">
            {tNav("about")}
          </Link>
          <Link href="/contact" className="text-text-muted hover:text-text transition-colors">
            {tNav("contact")}
          </Link>
          <Link href="/dashboard" className="text-text-muted hover:text-text transition-colors">
            {tNav("dashboard")}
          </Link>
        </nav>

        <div className="text-sm text-text-muted md:text-end">
          <p>© {year} {tBrand("name")}. {t("rights")}</p>
          <p className="mt-1">{t("built")}</p>
        </div>
      </div>
    </footer>
  );
}

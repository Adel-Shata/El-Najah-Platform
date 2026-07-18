"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu({ locale }: { locale: "en" | "ar" }) {
  const t = useTranslations("nav");
  const tAdmin = useTranslations("admin");
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="size-9 rounded-full bg-border animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-md text-text hover:bg-bg transition-colors"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/auth/register"
          className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          {t("signUp")}
        </Link>
      </div>
    );
  }

  const user = session.user;
  const isAdmin = user.role === "ADMIN";
  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full hover:bg-bg transition-colors"
      >
        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-2 w-56 rounded-xl border border-border bg-surface shadow-lg py-1 z-50",
            locale === "ar" ? "left-0" : "right-0"
          )}
        >
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-text truncate">{user.name || "User"}</p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>

          <Link
            href={isAdmin ? "/admin" : "/dashboard"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors"
          >
            <LayoutDashboard className="size-4 text-text-muted" />
            {isAdmin ? tAdmin("dashboard") : t("dashboard")}
          </Link>

          <button
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: `/${locale}` });
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors"
          >
            <LogOut className="size-4 text-text-muted" />
            {t("logOut")}
          </button>
        </div>
      )}
    </div>
  );
}

export function UserMenuMobile({ locale }: { locale: "en" | "ar" }) {
  const t = useTranslations("nav");
  const tAdmin = useTranslations("admin");
  const { data: session, status } = useSession();

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex items-center gap-2 pt-3 mt-2 border-t border-border">
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-md text-text border border-border"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/auth/register"
          className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground"
        >
          {t("signUp")}
        </Link>
      </div>
    );
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="flex flex-col gap-1 pt-3 mt-2 border-t border-border">
      <Link
        href={isAdmin ? "/admin" : "/dashboard"}
        className="px-3 py-3 text-sm rounded-md text-text-muted hover:text-text hover:bg-bg"
      >
        {isAdmin ? tAdmin("dashboard") : t("dashboard")}
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: `/${locale}` })}
        className="px-3 py-3 text-sm rounded-md text-text-muted hover:text-text hover:bg-bg text-left"
      >
        {t("logOut")}
      </button>
    </div>
  );
}

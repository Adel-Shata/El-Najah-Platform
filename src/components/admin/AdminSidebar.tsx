"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  HelpCircle,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "nav.dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "nav.categories", href: "/admin/categories", icon: FolderKanban },
  { name: "nav.exams", href: "/admin/exams", icon: FileText },
  { name: "nav.questions", href: "/admin/questions", icon: HelpCircle },
  { name: "nav.students", href: "/admin/students", icon: Users },
  { name: "nav.results", href: "/admin/results", icon: BarChart3 },
  { name: "nav.settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("admin");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-surface border-r border-border transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <Link href={`/${pathname.split("/")[1]}/admin`} className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                <svg viewBox="0 0 32 32" fill="none" className="size-5 text-primary-foreground" aria-hidden="true">
                  <rect width="32" height="32" rx="8" fill="currentColor" />
                  <path d="M9 22V10h2.6l3.4 7.2L18.4 10H21v12h-2v-7.6L16.2 20h-2.4L11 14.4V22H9z" fill="currentColor" />
                </svg>
              </div>
              <span className="font-semibold text-text">El-Najah</span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg transition-colors"
              aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            >
              {collapsed ? <ChevronLeft className="size-5 rotate-180" /> : <ChevronLeft className="size-5" />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg transition-colors"
              aria-label={t("closeSidebar")}
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label={t("navigation")}>
          {navigation.map((item) => {
            const isActive = pathname === `/${pathname.split("/")[1]}${item.href}` ||
              (item.href !== "/admin" && pathname.startsWith(`/${pathname.split("/")[1]}${item.href}`));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={`/${pathname.split("/")[1]}${item.href}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-text-muted hover:text-text hover:bg-bg",
                  collapsed && "justify-center px-0"
                )}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? t(item.name) : undefined}
              >
                <Icon className="size-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>{t(item.name)}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {!collapsed ? (
            <button
              onClick={() => signOut({ callbackUrl: `/${pathname.split("/")[1]}` })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="size-5" aria-hidden="true" />
              <span>{t("signOut")}</span>
            </button>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: `/${pathname.split("/")[1]}` })}
              className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
              title={t("signOut")}
            >
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover transition-colors"
        aria-label={t("openSidebar")}
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
    </>
  );
}
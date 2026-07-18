"use client";

import { useTranslations } from "next-intl";
import { CreditCard, Clock, Award, TrendingUp } from "lucide-react";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion";

interface Exam {
  granted: number;
  used: number;
  remaining: number;
}

interface StatsCardsProps {
  exams: Exam[];
}

export function StatsCards({ exams }: StatsCardsProps) {
  const t = useTranslations("dashboard");
  const totalPurchased = exams.reduce((sum, e) => sum + e.granted, 0);
  const totalUsed = exams.reduce((sum, e) => sum + e.used, 0);
  const totalRemaining = totalPurchased - totalUsed;
  const passRate = totalPurchased > 0 ? Math.round((totalUsed / totalPurchased) * 100) : 0;

  const stats = [
    {
      icon: CreditCard,
      label: t("stats.purchased"),
      value: totalPurchased,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Clock,
      label: t("stats.remaining"),
      value: totalRemaining,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      icon: Award,
      label: t("stats.completed"),
      value: totalUsed,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      icon: TrendingUp,
      label: t("stats.passRate"),
      value: `${passRate}%`,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
  ];

  return (
    <StaggerGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, i) => (
        <StaggerItem key={i}>
          <FadeIn>
            <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted font-medium">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold {stat.color}">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className="size-6" />
                </div>
              </div>
            </div>
          </FadeIn>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
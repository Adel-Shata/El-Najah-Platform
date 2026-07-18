import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/SettingsForm";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminSettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/settings`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  const settings = await prisma.adminSettings.findUnique({
    where: { id: "singleton" },
  });

  const t = await getTranslations({ locale, namespace: "admin" });

  // Transform settings to match SettingsForm expected types
  const initialSettings = settings
    ? {
        twoAttemptPrice: settings.twoAttemptPrice,
        fourAttemptPrice: settings.fourAttemptPrice,
        whatsappNumber: settings.whatsappNumber ?? "",
        whatsappEnabled: settings.whatsappEnabled,
        whatsappMessage: settings.whatsappMessage ?? "",
        siteNameEn: settings.siteNameEn,
        siteNameAr: settings.siteNameAr,
        supportEmail: settings.supportEmail,
        maintenanceMode: settings.maintenanceMode,
        loginMethod: (settings.loginMethod as "email" | "username" | "both") ?? "email",
      }
    : null;

  return (
    <div className="container-app py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text mb-2">
          {t("settings.title")}
        </h1>
        <p className="text-text-muted">{t("settings.subtitle")}</p>
      </div>

      <SettingsForm locale={locale as "en" | "ar"} initialSettings={initialSettings} />
    </div>
  );
}
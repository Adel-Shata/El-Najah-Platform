"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2, MessageSquare, Phone, LogIn } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";

interface SettingsData {
  twoAttemptPrice: number;
  fourAttemptPrice: number;
  whatsappNumber: string;
  whatsappEnabled: boolean;
  whatsappMessage: string;
  siteNameEn: string;
  siteNameAr: string;
  supportEmail: string;
  maintenanceMode: boolean;
  loginMethod: "email" | "username" | "both";
}

interface SettingsFormProps {
  locale: "en" | "ar";
  initialSettings: SettingsData | null;
}

export function SettingsForm({ locale, initialSettings }: SettingsFormProps) {
  const t = useTranslations("admin");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<SettingsData>({
    twoAttemptPrice: initialSettings?.twoAttemptPrice || 2900,
    fourAttemptPrice: initialSettings?.fourAttemptPrice || 4900,
    whatsappNumber: initialSettings?.whatsappNumber || "",
    whatsappEnabled: initialSettings?.whatsappEnabled ?? true,
    whatsappMessage: initialSettings?.whatsappMessage || "",
    siteNameEn: initialSettings?.siteNameEn || "El-Najah",
    siteNameAr: initialSettings?.siteNameAr || "النجاح",
    supportEmail: initialSettings?.supportEmail || "support@el-najah.com",
    maintenanceMode: initialSettings?.maintenanceMode ?? false,
    loginMethod: initialSettings?.loginMethod ?? "email",
  });

  const handleChange = (field: keyof SettingsData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setShowSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save settings");
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const testWhatsApp = () => {
    if (!formData.whatsappNumber) {
      alert(t("enterWhatsAppFirst"));
      return;
    }
    const message = encodeURIComponent(formData.whatsappMessage || "");
    const url = `https://wa.me/${formData.whatsappNumber.replace(/\D/g, "")}?text=${message}`;
    window.open(url, "_blank");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Pricing Section */}
      <FadeIn>
        <section className="p-6 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.75 1 1.12 1.12 1 2.62 0 3.75-.5.5-1.12 1.12-1 2 0 1.11-.89 2-2 2s-2-.89-2-2-1.343-2-3-2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text">{t("settings.pricing.title")}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">{t("settings.pricing.twoAttempts")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{locale === "ar" ? "" : "$"}</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.twoAttemptPrice}
                  onChange={(e) => handleChange("twoAttemptPrice", Number(e.target.value))}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition",
                    locale === "ar" ? "pl-8 pr-3" : "pl-8 pr-3"
                  )}
                  placeholder="2900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">{locale === "ar" ? "$" : ""}</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">{t("settings.pricing.inCents")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">{t("settings.pricing.fourAttempts")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{locale === "ar" ? "" : "$"}</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.fourAttemptPrice}
                  onChange={(e) => handleChange("fourAttemptPrice", Number(e.target.value))}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition",
                    locale === "ar" ? "pl-8 pr-3" : "pl-8 pr-3"
                  )}
                  placeholder="4900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">{locale === "ar" ? "$" : ""}</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">{t("settings.pricing.inCents")}</p>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Login Method */}
      <FadeIn delay={0.05}>
        <section className="p-6 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
              <LogIn className="size-5" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-text">{t("settings.loginMethod.title")}</h2>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-text-muted">{t("settings.loginMethod.description")}</p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChange("loginMethod", "email")}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                  formData.loginMethod === "email"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-bg text-text-muted hover:border-border/80"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t("settings.loginMethod.email")}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange("loginMethod", "username")}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                  formData.loginMethod === "username"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-bg text-text-muted hover:border-border/80"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t("settings.loginMethod.username")}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange("loginMethod", "both")}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                  formData.loginMethod === "both"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-bg text-text-muted hover:border-border/80"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("settings.loginMethod.both")}
                </div>
              </button>
            </div>

            {formData.loginMethod === "username" && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                {t("settings.loginMethod.usernameWarning")}
              </div>
            )}
          </div>
        </section>
      </FadeIn>

      {/* WhatsApp Settings */}
      <FadeIn delay={0.1}>
        <section className="p-6 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green/10 text-green-600">
              <Phone className="size-5" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-text">{t("settings.whatsapp.title")}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.whatsappEnabled}
                  onChange={(e) => handleChange("whatsappEnabled", e.target.checked)}
                  className="size-5 rounded border-border bg-bg text-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-text">{t("settings.whatsapp.enabled")}</span>
              </label>
              {formData.whatsappEnabled && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                  {t("settings.whatsapp.active")}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">{t("settings.whatsapp.number")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">+</span>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleChange("whatsappNumber", e.target.value.replace(/\D/g, ""))}
                  placeholder="966501234567"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition pl-8"
                />
              </div>
              <p className="mt-1 text-sm text-text-muted">{t("settings.whatsapp.numberDesc")}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">{t("settings.whatsapp.message")}</label>
              <textarea
                value={formData.whatsappMessage}
                onChange={(e) => handleChange("whatsappMessage", e.target.value)}
                rows={4}
                placeholder={t("settings.whatsapp.messagePlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
              />
              <p className="mt-1 text-sm text-text-muted">{t("settings.whatsapp.messageDesc")}</p>
            </div>

            <button
              type="button"
              onClick={testWhatsApp}
              className="px-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-2"
            >
              <MessageSquare className="size-4" aria-hidden="true" />
              {t("settings.whatsapp.test")}
            </button>
          </div>
        </section>
      </FadeIn>

      {/* General Settings */}
      <FadeIn delay={0.2}>
        <section className="p-6 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber/10 text-amber-600">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 011.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 01-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 01-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 01-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 011.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text">{t("settings.general.title")}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">{t("settings.general.siteNameEn")}</label>
              <input
                type="text"
                value={formData.siteNameEn}
                onChange={(e) => handleChange("siteNameEn", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="El-Najah"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">{t("settings.general.siteNameAr")}</label>
              <input
                type="text"
                value={formData.siteNameAr}
                onChange={(e) => handleChange("siteNameAr", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="النجاح"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">{t("settings.general.supportEmail")}</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => handleChange("supportEmail", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="support@el-najah.com"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={formData.maintenanceMode}
                onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                className="size-5 rounded border-border bg-bg text-primary focus:ring-2 focus:ring-primary/20"
              />
              <label htmlFor="maintenanceMode" className="text-text cursor-pointer">
                {t("settings.general.maintenanceMode")}
              </label>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Save Button */}
      <FadeIn delay={0.3}>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              "px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2",
              isSaving
                ? "bg-primary/50 text-primary-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary-hover"
            )}
          >
            {isSaving && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            {showSuccess && !isSaving && <CheckCircle2 className="size-5" aria-hidden="true" />}
            {isSaving ? t("saving") : showSuccess ? t("saved") : t("saveSettings")}
          </button>
        </div>
      </FadeIn>
    </form>
  );
}

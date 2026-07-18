"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mail, Clock, Check } from "lucide-react";
import { FadeIn } from "@/components/motion";

export function ContactForm() {
  const t = useTranslations("contact");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(() => {
      setTimeout(() => setSent(true), 400);
    });
  }

  if (sent) {
    return (
      <FadeIn>
        <div className="p-8 rounded-2xl border border-border bg-surface text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="size-6" />
          </div>
          <p className="mt-4 text-text font-medium">Message sent.</p>
        </div>
      </FadeIn>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="p-8 rounded-2xl border border-border bg-surface space-y-5"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text mb-1.5">
          {t("form.name")}
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder={t("form.placeholder.name")}
          className="w-full h-10 px-3 text-sm rounded-md border border-border bg-bg text-text placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
          {t("form.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={t("form.placeholder.email")}
          className="w-full h-10 px-3 text-sm rounded-md border border-border bg-bg text-text placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-text mb-1.5">
          {t("form.message")}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder={t("form.placeholder.message")}
          className="w-full px-3 py-2.5 text-sm rounded-md border border-border bg-bg text-text placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center h-11 px-5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors"
      >
        {pending ? "..." : t("form.send")}
      </button>
    </form>
  );
}

export function ContactChannels() {
  const t = useTranslations("contact.channels");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-text">{t("title")}</h2>
      <div className="flex items-start gap-3">
        <div className="inline-flex size-10 items-center justify-center rounded-md bg-bg text-primary shrink-0">
          <Mail className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-text">{t("email")}</p>
          <a
            href="mailto:hello@el-najah.example"
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            hello@el-najah.example
          </a>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="inline-flex size-10 items-center justify-center rounded-md bg-bg text-primary shrink-0">
          <Clock className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-text">{t("support")}</p>
          <p className="text-sm text-text-muted">Sun–Thu, 9:00–17:00</p>
        </div>
      </div>
    </div>
  );
}

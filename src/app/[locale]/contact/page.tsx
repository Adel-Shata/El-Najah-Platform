import { setRequestLocale, getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/motion";
import { ContactForm, ContactChannels } from "@/components/contact-form";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <section className="container-app py-24 md:py-32">
      <FadeIn className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-text">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-text-muted">{t("subtitle")}</p>
      </FadeIn>

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        <FadeIn delay={0.1}>
          <ContactForm />
        </FadeIn>
        <FadeIn delay={0.2}>
          <ContactChannels />
        </FadeIn>
      </div>
    </section>
  );
}

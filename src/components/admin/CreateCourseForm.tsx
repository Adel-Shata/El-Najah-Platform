"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/motion";
import { Save, X, Plus, Trash2 } from "lucide-react";

interface Lesson {
  title: string;
  description: string;
  content: string;
  durationMinutes: number;
}

interface CreateCourseFormProps {
  locale: "en" | "ar";
}

export function CreateCourseForm({ locale }: CreateCourseFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.courseForm");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "lessons">("basic");
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const addLesson = () => {
    setLessons([...lessons, { title: "", description: "", content: "", durationMinutes: 0 }]);
  };

  const removeLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const updateLesson = (index: number, field: keyof Lesson, value: string | number) => {
    const updated = [...lessons];
    updated[index] = { ...updated[index], [field]: value };
    setLessons(updated);
  };

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    const form = document.querySelector("form") as HTMLFormElement;
    const formData = new FormData(form);

    const title = formData.get("title") as string;

    if (!title) {
      alert(t("validate.titleRequired"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: formData.get("description") || null,
          thumbnail: formData.get("thumbnail") || null,
          status,
          lessons,
        }),
      });

      if (res.ok) {
        router.push(`/${locale}/admin/courses`);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to create course:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("basic")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "basic" ? "bg-primary text-primary-foreground" : "text-text-muted hover:text-text hover:bg-bg"
          }`}
        >
          {t("tabs.basic")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("lessons")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "lessons" ? "bg-primary text-primary-foreground" : "text-text-muted hover:text-text hover:bg-bg"
          }`}
        >
          {t("tabs.lessons")} ({lessons.length})
        </button>
      </div>

      {/* Basic Info Tab */}
      {activeTab === "basic" && (
        <FadeIn>
          <div className="p-6 rounded-2xl border border-border bg-surface space-y-4">
            <h2 className="text-lg font-semibold text-text">{t("basic.title")}</h2>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">{t("basic.courseTitle")}</label>
              <input
                name="title"
                required
                placeholder={t("basic.titlePlaceholder")}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-bg text-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">{t("basic.description")}</label>
              <textarea
                name="description"
                rows={3}
                placeholder={t("basic.descriptionPlaceholder")}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">{t("basic.thumbnail")}</label>
              <input
                name="thumbnail"
                placeholder={t("basic.thumbnailPlaceholder")}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-bg text-text"
              />
            </div>
          </div>
        </FadeIn>
      )}

      {/* Lessons Tab */}
      {activeTab === "lessons" && (
        <FadeIn>
          <div className="p-6 rounded-2xl border border-border bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">{t("lessons.title")}</h2>
              <button
                type="button"
                onClick={addLesson}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                <Plus className="size-4" /> {t("lessons.addLesson")}
              </button>
            </div>

            {lessons.length === 0 ? (
              <p className="text-text-muted text-center py-8">{t("lessons.noLessons")}</p>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div key={index} className="p-4 rounded-xl border border-border bg-bg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text">#{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeLesson(index)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        placeholder={t("lessons.lessonTitlePlaceholder")}
                        value={lesson.title}
                        onChange={(e) => updateLesson(index, "title", e.target.value)}
                        className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-surface text-text"
                      />
                      <input
                        type="number"
                        placeholder={t("lessons.lessonDuration")}
                        value={lesson.durationMinutes || ""}
                        onChange={(e) => updateLesson(index, "durationMinutes", parseInt(e.target.value) || 0)}
                        className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-surface text-text"
                      />
                    </div>

                    <input
                      placeholder={t("lessons.lessonDescriptionPlaceholder")}
                      value={lesson.description}
                      onChange={(e) => updateLesson(index, "description", e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-surface text-text"
                    />

                    <textarea
                      placeholder={t("lessons.lessonContentPlaceholder")}
                      value={lesson.content}
                      onChange={(e) => updateLesson(index, "content", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text resize-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6 justify-end">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/courses`)}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg transition-colors"
        >
          {t("actions.cancel")}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("DRAFT")}
          disabled={saving}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text hover:bg-bg transition-colors disabled:opacity-50"
        >
          {t("actions.saveDraft")}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("PUBLISHED")}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          <Save className="size-4" /> {t("actions.publish")}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/motion";
import { createCourse, updateCourse } from "@/app/[locale]/admin/courses/actions";
import {
  Save, Plus, Trash2, GripVertical, Upload, Film, Link2,
  AlertCircle, CheckCircle, X, Loader2, Image as ImageIcon,
} from "lucide-react";

interface Lesson {
  tempId: string;
  id?: string;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  videoType: "" | "youtube" | "upload";
  durationMinutes: number;
  durationSeconds: number;
  durationAuto: boolean;
  videoFile?: File;
  thumbnailFile?: File;
  uploading?: boolean;
  uploadError?: string;
}

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  status: string;
  lessons: {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    videoUrl: string | null;
    videoType: string | null;
    durationMinutes: number;
    durationSeconds: number;
    order: number;
  }[];
}

interface CreateCourseFormProps {
  locale: "en" | "ar";
  course?: CourseData;
}

let tempCounter = 0;
function tempId() {
  return `tmp_${++tempCounter}_${Date.now()}`;
}

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-border bg-bg text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition";
const labelClass = "block text-sm font-medium text-text-muted mb-2";

export function CreateCourseForm({ locale, course }: CreateCourseFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.courseForm");
  const isEdit = !!course;

  const [title, setTitle] = useState(course?.title || "");
  const [description, setDescription] = useState(course?.description || "");
  const [thumbnail, setThumbnail] = useState(course?.thumbnail || "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    (course?.status as "DRAFT" | "PUBLISHED") || "DRAFT"
  );
  const [lessons, setLessons] = useState<Lesson[]>(
    course?.lessons
      ? course.lessons.map((l) => ({
          tempId: tempId(),
          id: l.id,
          title: l.title,
          description: l.description || "",
          content: l.content || "",
          videoUrl: l.videoUrl || "",
          videoType: (l.videoType as "" | "youtube" | "upload") || "",
          durationMinutes: l.durationMinutes,
          durationSeconds: l.durationSeconds,
          durationAuto: !!l.videoUrl,
        }))
      : []
  );
  const [selectedLesson, setSelectedLesson] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // --- Thumbnail upload ---
  const uploadThumbnail = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "thumbnail");
    try {
      const res = await fetch("/api/upload/course", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setThumbnail(data.url);
      else alert(data.error || "Upload failed");
    } catch {
      alert("Upload failed");
    }
  };

  // --- Video upload ---
  const uploadVideo = async (lessonIdx: number, file: File) => {
    setLessons((prev) =>
      prev.map((l, i) => (i === lessonIdx ? { ...l, uploading: true, uploadError: "" } : l))
    );
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "video");
    try {
      const res = await fetch("/api/upload/course", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setLessons((prev) =>
          prev.map((l, i) =>
            i === lessonIdx
              ? { ...l, videoUrl: data.url, videoType: "upload", uploading: false }
              : l
          )
        );
        // Detect duration from video element
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          const secs = Math.round(video.duration);
          setLessons((prev) =>
            prev.map((l, i) =>
              i === lessonIdx
                ? { ...l, durationSeconds: secs, durationMinutes: Math.ceil(secs / 60), durationAuto: true }
                : l
            )
          );
        };
        video.src = data.url;
      } else {
        setLessons((prev) =>
          prev.map((l, i) =>
            i === lessonIdx ? { ...l, uploading: false, uploadError: data.error } : l
          )
        );
      }
    } catch {
      setLessons((prev) =>
        prev.map((l, i) =>
          i === lessonIdx ? { ...l, uploading: false, uploadError: "Upload failed" } : l
        )
      );
    }
  };

  // --- YouTube duration detection ---
  const fetchYouTubeDuration = async (lessonIdx: number, url: string) => {
    try {
      const res = await fetch(`/api/youtube/duration?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (res.ok) {
        setLessons((prev) =>
          prev.map((l, i) =>
            i === lessonIdx
              ? {
                  ...l,
                  durationSeconds: data.durationSeconds,
                  durationMinutes: data.durationMinutes,
                  durationAuto: true,
                }
              : l
          )
        );
      } else {
        setLessons((prev) =>
          prev.map((l, i) =>
            i === lessonIdx ? { ...l, durationAuto: false } : l
          )
        );
      }
    } catch {
      setLessons((prev) =>
        prev.map((l, i) =>
          i === lessonIdx ? { ...l, durationAuto: false } : l
        )
      );
    }
  };

  // --- Lesson CRUD ---
  const addLesson = () => {
    const newLesson: Lesson = {
      tempId: tempId(),
      title: "",
      description: "",
      content: "",
      videoUrl: "",
      videoType: "",
      durationMinutes: 0,
      durationSeconds: 0,
      durationAuto: false,
    };
    setLessons((prev) => [...prev, newLesson]);
    setSelectedLesson(lessons.length);
  };

  const removeLesson = (index: number) => {
    setLessons((prev) => prev.filter((_, i) => i !== index));
    if (selectedLesson >= lessons.length - 1) {
      setSelectedLesson(Math.max(0, lessons.length - 2));
    }
  };

  const updateLesson = (index: number, field: keyof Lesson, value: any) => {
    setLessons((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  // --- Drag and drop ---
  const handleDragStart = (index: number) => setDragIdx(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
  };
  const handleDrop = (index: number) => {
    if (dragIdx === null || dragIdx === index) return;
    const newLessons = [...lessons];
    const [moved] = newLessons.splice(dragIdx, 1);
    newLessons.splice(index, 0, moved);
    setLessons(newLessons);
    setSelectedLesson(index);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // --- Validation ---
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = t("validate.titleRequired");
    if (lessons.length === 0) e.lessons = t("validate.lessonsRequired") || "At least one lesson is required";
    lessons.forEach((l, i) => {
      if (!l.title.trim()) e[`lesson_${i}_title`] = t("validate.lessonTitleRequired") || "Lesson title is required";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // --- Submit ---
  const handleSubmit = async (submitStatus: "DRAFT" | "PUBLISHED") => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        locale,
        title: title.trim(),
        description: description.trim() || undefined,
        thumbnail: thumbnail || undefined,
        status: submitStatus,
        lessons: lessons.map((l, i) => ({
          id: l.id,
          title: l.title.trim(),
          description: l.description.trim() || undefined,
          content: l.content.trim() || undefined,
          videoUrl: l.videoUrl || undefined,
          videoType: l.videoType || undefined,
          durationMinutes: l.durationMinutes,
          durationSeconds: l.durationSeconds,
        })),
      };

      if (isEdit && course) {
        await updateCourse(course.id, payload);
      } else {
        await createCourse(payload);
      }
    } catch (err: any) {
      if (err?.message !== "Redirect") {
        console.error("Failed to save course:", err);
        alert(err?.message || "Failed to save course");
      }
    } finally {
      setSaving(false);
    }
  };

  const lesson = lessons[selectedLesson];
  const totalDuration = lessons.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => {}}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
        >
          {t("tabs.basic")}
        </button>
        <button
          type="button"
          onClick={() => {}}
          className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-bg transition-colors"
        >
          {t("tabs.lessons")} ({lessons.length})
        </button>
      </div>

      {/* Basic Info */}
      <FadeIn>
        <div className="p-6 rounded-2xl border border-border bg-surface space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-text">{t("basic.title")}</h2>

          <div>
            <label className={labelClass}>{t("basic.courseTitle")} *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("basic.titlePlaceholder")}
              className={`${inputClass} ${errors.title ? "border-red-500" : ""}`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className={labelClass}>{t("basic.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t("basic.descriptionPlaceholder")}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>{t("basic.thumbnail")}</label>
            <div className="flex items-center gap-3">
              {thumbnail ? (
                <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setThumbnail("")}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500 text-white"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-32 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-text-muted hover:text-primary transition-colors"
                >
                  <ImageIcon className="size-5" />
                  <span className="text-xs">{t("basic.uploadThumbnail") || "Upload"}</span>
                </button>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadThumbnail(file);
                }}
              />
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Lessons */}
      <FadeIn>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text">{t("lessons.title")}</h2>
            <button
              type="button"
              onClick={addLesson}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <Plus className="size-4" /> {t("lessons.addLesson")}
            </button>
          </div>

          {errors.lessons && (
            <div className="px-4 py-2 bg-red-50 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="size-4" /> {errors.lessons}
            </div>
          )}

          {lessons.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <Film className="size-10 mx-auto mb-3 opacity-40" />
              <p>{t("lessons.noLessons")}</p>
            </div>
          ) : (
            <div className="flex min-h-[500px]">
              {/* Lesson list sidebar */}
              <div className="w-72 border-r border-border bg-bg/50 overflow-y-auto max-h-[600px]">
                <div className="p-2 space-y-1">
                  {lessons.map((l, i) => (
                    <div
                      key={l.tempId}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDrop={() => handleDrop(i)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedLesson(i)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors group ${
                        selectedLesson === i
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-bg border border-transparent"
                      } ${dragOverIdx === i ? "border-t-2 border-primary" : ""}`}
                    >
                      <GripVertical className="size-4 text-text-muted opacity-40 group-hover:opacity-100 cursor-grab shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {l.title || `${t("lessons.lessonTitle") || "Lesson"} ${i + 1}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          {l.videoType === "youtube" && <Link2 className="size-3" />}
                          {l.videoType === "upload" && <Film className="size-3" />}
                          {l.durationSeconds > 0 && <span>{formatDuration(l.durationSeconds)}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeLesson(i); }}
                        className="p-1 rounded text-text-muted hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lesson editor */}
              {lesson && (
                <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[600px]">
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                    {(t("lessons.lessonTitle") || "Lesson")} {selectedLesson + 1}
                  </h3>

                  <div>
                    <label className={labelClass}>{t("lessons.lessonTitle")} *</label>
                    <input
                      value={lesson.title}
                      onChange={(e) => updateLesson(selectedLesson, "title", e.target.value)}
                      placeholder={t("lessons.lessonTitlePlaceholder")}
                      className={`${inputClass} ${errors[`lesson_${selectedLesson}_title`] ? "border-red-500" : ""}`}
                    />
                    {errors[`lesson_${selectedLesson}_title`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`lesson_${selectedLesson}_title`]}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>{t("lessons.lessonDescription")}</label>
                    <input
                      value={lesson.description}
                      onChange={(e) => updateLesson(selectedLesson, "description", e.target.value)}
                      placeholder={t("lessons.lessonDescriptionPlaceholder")}
                      className={inputClass}
                    />
                  </div>

                  {/* Video Section */}
                  <div className="space-y-3">
                    <label className={labelClass}>{t("lessons.video") || "Video"}</label>

                    {/* YouTube URL input */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 className="size-4 text-text-muted" />
                        <span className="text-xs text-text-muted">{t("lessons.youtubeUrl") || "YouTube URL"}</span>
                      </div>
                      <input
                        value={lesson.videoType === "youtube" ? lesson.videoUrl : ""}
                        onChange={(e) => {
                          const url = e.target.value;
                          updateLesson(selectedLesson, "videoUrl", url);
                          updateLesson(selectedLesson, "videoType", url ? "youtube" : "");
                          updateLesson(selectedLesson, "durationAuto", false);
                          if (url) fetchYouTubeDuration(selectedLesson, url);
                        }}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className={inputClass}
                      />
                    </div>

                    <div className="text-center text-xs text-text-muted">— {t("lessons.or") || "or"} —</div>

                    {/* Video file upload */}
                    <div>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateLesson(selectedLesson, "videoType", "upload");
                            updateLesson(selectedLesson, "videoUrl", "");
                            uploadVideo(selectedLesson, file);
                          }
                          e.target.value = "";
                        }}
                      />
                      {lesson.videoType === "upload" && lesson.videoUrl ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-border">
                          <Film className="size-5 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text truncate">{lesson.videoUrl.split("/").pop()}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              updateLesson(selectedLesson, "videoUrl", "");
                              updateLesson(selectedLesson, "videoType", "");
                              updateLesson(selectedLesson, "durationAuto", false);
                            }}
                            className="p-1 rounded text-text-muted hover:text-red-600"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={lesson.uploading}
                          className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-text-muted hover:text-primary transition-colors disabled:opacity-50"
                        >
                          {lesson.uploading ? (
                            <><Loader2 className="size-4 animate-spin" /> {t("lessons.uploading") || "Uploading..."}</>
                          ) : (
                            <><Upload className="size-4" /> {t("lessons.uploadVideo") || "Upload Video"}</>
                          )}
                        </button>
                      )}
                      {lesson.uploadError && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="size-3" /> {lesson.uploadError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className={labelClass}>{t("lessons.lessonDuration")}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        value={lesson.durationMinutes || ""}
                        onChange={(e) => {
                          const mins = parseInt(e.target.value) || 0;
                          updateLesson(selectedLesson, "durationMinutes", mins);
                          updateLesson(selectedLesson, "durationSeconds", mins * 60);
                          updateLesson(selectedLesson, "durationAuto", false);
                        }}
                        placeholder="0"
                        readOnly={lesson.durationAuto && lesson.videoType === "youtube"}
                        className={`${inputClass} max-w-[120px] ${lesson.durationAuto && lesson.videoType === "youtube" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      />
                      <span className="text-sm text-text-muted">min</span>
                      {lesson.durationAuto && lesson.durationSeconds > 0 && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="size-3" /> {formatDuration(lesson.durationSeconds)}
                        </span>
                      )}
                    </div>
                    {lesson.durationAuto && lesson.videoType === "youtube" && (
                      <p className="text-xs text-text-muted mt-1">
                        {t("lessons.autoDetected") || "Auto-detected from YouTube"}
                      </p>
                    )}
                  </div>

                  {/* Content / Notes */}
                  <div>
                    <label className={labelClass}>{t("lessons.lessonContent")}</label>
                    <textarea
                      value={lesson.content}
                      onChange={(e) => updateLesson(selectedLesson, "content", e.target.value)}
                      rows={3}
                      placeholder={t("notesPlaceholder") || "Additional notes for this lesson..."}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Total duration footer */}
          {lessons.length > 0 && totalDuration > 0 && (
            <div className="px-4 py-2 border-t border-border bg-bg/50 text-sm text-text-muted">
              {t("lessons.totalDuration") || "Total duration"}: {formatDuration(totalDuration)}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Actions */}
      <div className="flex gap-3 mt-6 justify-end">
        <button
          type="button"
          onClick={() => router.push("/admin/courses")}
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

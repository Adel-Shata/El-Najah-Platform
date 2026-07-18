"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createExam, updateExam } from "@/app/[locale]/admin/exams/actions";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  HelpCircle,
  Search,
  X,
  Upload,
  ImageIcon,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface GlobalPrices {
  twoAttemptPrice: number;
  fourAttemptPrice: number;
}

interface ExistingQuestion {
  id: string;
  type: string;
  text: string;
  explanation: string | null;
  points: number;
  exam: { title: string };
  options: { id: string; text: string; isCorrect: boolean; order: number }[];
}

interface FormOption {
  tempId: string;
  text: string;
  isCorrect: boolean;
}

interface FormQuestion {
  tempId: string;
  type: string;
  text: string;
  explanation: string;
  points: number;
  options: FormOption[];
  image: string | null;
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  difficulty: string;
  durationMinutes: number;
  passingScore: number;
  twoAttemptPrice: string;
  fourAttemptPrice: string;
  status: "DRAFT" | "PUBLISHED";
  enableTimer: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  showScoreImmediately: boolean;
  allowReview: boolean;
}

let tempCounter = 0;
function tempId() {
  return `tmp_${++tempCounter}_${Date.now()}`;
}

function newQuestion(type: string): FormQuestion {
  const q: FormQuestion = {
    tempId: tempId(),
    type,
    text: "",
    explanation: "",
    points: 1,
    options: [],
    image: null,
  };
  if (type === "MCQ_SINGLE" || type === "MCQ_MULTIPLE") {
    q.options = [
      { tempId: tempId(), text: "", isCorrect: false },
      { tempId: tempId(), text: "", isCorrect: false },
      { tempId: tempId(), text: "", isCorrect: false },
      { tempId: tempId(), text: "", isCorrect: false },
    ];
  } else if (type === "TRUE_FALSE") {
    q.options = [
      { tempId: tempId(), text: "True", isCorrect: true },
      { tempId: tempId(), text: "False", isCorrect: false },
    ];
  }
  return q;
}

const QUESTION_TYPES = [
  "MCQ_SINGLE", "MCQ_MULTIPLE", "TRUE_FALSE", "SHORT_ANSWER", "NUMERICAL"
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "EASY", color: "bg-emerald-100 text-emerald-700" },
  { value: "MEDIUM", color: "bg-amber-100 text-amber-700" },
  { value: "HARD", color: "bg-red-100 text-red-700" },
] as const;

interface ExamData {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  difficulty: string;
  durationMinutes: number;
  passingScore: number;
  twoAttemptPrice: number | null;
  fourAttemptPrice: number | null;
  status: "DRAFT" | "PUBLISHED";
  enableTimer: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  showScoreImmediately: boolean;
  allowReview: boolean;
  questions: {
    id: string;
    type: string;
    text: string;
    explanation: string | null;
    points: number;
    image: string | null;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
      order: number;
    }[];
  }[];
}

interface CreateExamFormProps {
  locale: "en" | "ar";
  categories: Category[];
  globalPrices: GlobalPrices | null;
  existingQuestions: ExistingQuestion[];
  exam?: ExamData;
}

export function CreateExamForm({
  locale,
  categories,
  globalPrices,
  existingQuestions,
  exam,
}: CreateExamFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.examForm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<"basic" | "pricing" | "options" | "questions">("basic");
  const isEditing = !!exam;

  const [form, setForm] = useState<FormData>({
    title: exam?.title ?? "",
    description: exam?.description ?? "",
    categoryId: exam?.categoryId ?? "",
    difficulty: exam?.difficulty ?? "MEDIUM",
    durationMinutes: exam?.durationMinutes ?? 60,
    passingScore: exam?.passingScore ?? 60,
    twoAttemptPrice: exam?.twoAttemptPrice != null ? String(exam.twoAttemptPrice) : "",
    fourAttemptPrice: exam?.fourAttemptPrice != null ? String(exam.fourAttemptPrice) : "",
    status: exam?.status ?? "DRAFT",
    enableTimer: exam?.enableTimer ?? true,
    shuffleQuestions: exam?.shuffleQuestions ?? true,
    shuffleOptions: exam?.shuffleOptions ?? true,
    showCorrectAnswers: exam?.showCorrectAnswers ?? false,
    showScoreImmediately: exam?.showScoreImmediately ?? true,
    allowReview: exam?.allowReview ?? true,
  });

  const [questions, setQuestions] = useState<FormQuestion[]>(
    exam?.questions?.map((q) => ({
      tempId: tempId(),
      type: q.type,
      text: q.text,
      explanation: q.explanation ?? "",
      points: q.points,
      image: q.image ?? null,
      options: q.options.map((o) => ({
        tempId: tempId(),
        text: o.text,
        isCorrect: o.isCorrect,
      })),
    })) ?? []
  );
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [showNewQDropdown, setShowNewQDropdown] = useState(false);
  const newQDropdownRef = useRef<HTMLDivElement>(null);

  const updateForm = useCallback((field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!showNewQDropdown) return;
    function handleClickOutside(e: MouseEvent) {
      if (newQDropdownRef.current && !newQDropdownRef.current.contains(e.target as Node)) {
        setShowNewQDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNewQDropdown]);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = t("validate.titleRequired");
    if (!form.categoryId) e.categoryId = t("validate.categoryRequired");
    if (form.durationMinutes < 1) e.durationMinutes = t("validate.durationMin");
    if (form.passingScore < 0 || form.passingScore > 100) e.passingScore = t("validate.passingScoreRange");
    if (questions.length === 0) e.questions = t("validate.questionsRequired");
    questions.forEach((q, i) => {
      if (!q.text.trim()) e[`q${i}_text`] = t("validate.qTextRequired", { n: i + 1 });
      if (q.points < 1) e[`q${i}_points`] = t("validate.qPoints", { n: i + 1 });
      if (q.type === "MCQ_SINGLE" || q.type === "MCQ_MULTIPLE") {
        if (q.options.length < 2) e[`q${i}_options`] = t("validate.qOptions", { n: i + 1 });
        if (q.options.some((o) => !o.text.trim())) e[`q${i}_optionsText`] = t("validate.qOptionsText", { n: i + 1 });
        if (q.type === "MCQ_SINGLE" && !q.options.some((o) => o.isCorrect)) e[`q${i}_correct`] = t("validate.qCorrectSingle", { n: i + 1 });
        if (q.type === "MCQ_MULTIPLE" && !q.options.some((o) => o.isCorrect)) e[`q${i}_correct`] = t("validate.qCorrectMultiple", { n: i + 1 });
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(status: "DRAFT" | "PUBLISHED") {
    if (!validate()) {
      const firstError = Object.keys(errors)[0];
      if (firstError.startsWith("q")) setActiveSection("questions");
      else if (firstError === "questions") setActiveSection("questions");
      else setActiveSection("basic");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        locale,
        title: form.title,
        description: form.description || undefined,
        categoryId: form.categoryId,
        difficulty: form.difficulty,
        durationMinutes: form.durationMinutes,
        passingScore: form.passingScore,
        twoAttemptPrice: form.twoAttemptPrice ? Number(form.twoAttemptPrice) : null,
        fourAttemptPrice: form.fourAttemptPrice ? Number(form.fourAttemptPrice) : null,
        status,
        enableTimer: form.enableTimer,
        shuffleQuestions: form.shuffleQuestions,
        shuffleOptions: form.shuffleOptions,
        showCorrectAnswers: form.showCorrectAnswers,
        showScoreImmediately: form.showScoreImmediately,
        allowReview: form.allowReview,
        questions: questions.map((q) => ({
          type: q.type,
          text: q.text,
          explanation: q.explanation || undefined,
          points: q.points,
          image: q.image || undefined,
          options: q.options.map((o) => ({
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        })),
      };
      if (isEditing) {
        await updateExam(exam.id, payload);
      } else {
        await createExam(payload);
      }
    } catch (err) {
      console.error("Failed to save exam:", err);
      setIsSubmitting(false);
    }
  }

  function addNewQuestion(type: string) {
    const q = newQuestion(type);
    setQuestions((prev) => [...prev, q]);
    setEditingQuestionIdx(questions.length);
    setShowQuestionForm(true);
  }

  function addFromBank(q: ExistingQuestion) {
    const newQ: FormQuestion = {
      tempId: tempId(),
      type: q.type,
      text: q.text,
      explanation: q.explanation || "",
      points: q.points,
      options: q.options.map((o) => ({
        tempId: tempId(),
        text: o.text,
        isCorrect: o.isCorrect,
      })),
      image: (q as any).image || null,
    };
    setQuestions((prev) => [...prev, newQ]);
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    if (editingQuestionIdx === idx) {
      setEditingQuestionIdx(null);
      setShowQuestionForm(false);
    } else if (editingQuestionIdx !== null && editingQuestionIdx > idx) {
      setEditingQuestionIdx(editingQuestionIdx - 1);
    }
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
    if (editingQuestionIdx === idx) setEditingQuestionIdx(newIdx);
    else if (editingQuestionIdx === newIdx) setEditingQuestionIdx(idx);
  }

  function updateQuestion(idx: number, field: keyof FormQuestion, value: any) {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function updateOption(qIdx: number, optIdx: number, field: keyof FormOption, value: any) {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIdx] };
      const opts = [...q.options];
      if (field === "isCorrect" && q.type === "MCQ_SINGLE") {
        opts.forEach((o, i) => (opts[i] = { ...o, isCorrect: i === optIdx }));
      } else {
        opts[optIdx] = { ...opts[optIdx], [field]: value };
      }
      q.options = opts;
      next[qIdx] = q;
      return next;
    });
  }

  function addOption(qIdx: number) {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIdx] };
      q.options = [...q.options, { tempId: tempId(), text: "", isCorrect: false }];
      next[qIdx] = q;
      return next;
    });
  }

  function removeOption(qIdx: number, optIdx: number) {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIdx] };
      q.options = q.options.filter((_, i) => i !== optIdx);
      next[qIdx] = q;
      return next;
    });
  }

  async function uploadQuestionImage(qIdx: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setQuestions((prev) => {
        const next = [...prev];
        next[qIdx] = { ...next[qIdx], image: data.url };
        return next;
      });
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  }

  function removeQuestionImage(qIdx: number) {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], image: null };
      return next;
    });
  }

  const filteredBank = existingQuestions.filter((q) =>
    q.text.toLowerCase().includes(bankSearch.toLowerCase()) ||
    q.exam.title.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const sections = [
    { key: "basic" as const, label: t("tabs.basic") },
    { key: "pricing" as const, label: t("tabs.pricing") },
    { key: "options" as const, label: t("tabs.options") },
    { key: "questions" as const, label: `${t("tabs.questions")} (${questions.length})` },
  ];

  const inputClass = cn(
    "w-full px-4 py-3 rounded-xl border border-border bg-bg text-text placeholder:text-text-muted",
    "focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
  );

  const labelClass = "block text-sm font-medium text-text-muted mb-2";

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <FadeIn>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                activeSection === s.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface border border-border text-text-muted hover:text-text hover:border-primary/30"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Basic Info */}
      {activeSection === "basic" && (
        <FadeIn>
          <section className="p-6 rounded-2xl border border-border bg-surface">
            <h2 className="text-xl font-semibold text-text mb-6">{t("basic.title")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>{t("basic.examTitle")}</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  className={cn(inputClass, errors.title && "border-red-500")}
                  placeholder={t("basic.titlePlaceholder")}
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{t("basic.description")}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                  placeholder={t("basic.descriptionPlaceholder")}
                />
              </div>
              <div>
                <label className={labelClass}>{t("basic.category")}</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => updateForm("categoryId", e.target.value)}
                  className={cn(inputClass, !form.categoryId && "text-text-muted", errors.categoryId && "border-red-500")}
                >
                  <option value="">{t("basic.categoryPlaceholder")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>}
              </div>
              <div>
                <label className={labelClass}>{t("basic.difficulty")}</label>
                <div className="flex gap-2">
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => updateForm("difficulty", d.value)}
                      className={cn(
                        "flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                        form.difficulty === d.value
                          ? d.color + " border-current"
                          : "border-border text-text-muted hover:border-primary/30"
                      )}
                    >
                      {t(`difficulty.${d.value.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("basic.duration")}</label>
                <input
                  type="number"
                  min={1}
                  value={form.durationMinutes}
                  onChange={(e) => updateForm("durationMinutes", Number(e.target.value))}
                  className={cn(inputClass, errors.durationMinutes && "border-red-500")}
                />
                {errors.durationMinutes && <p className="mt-1 text-sm text-red-500">{errors.durationMinutes}</p>}
              </div>
              <div>
                <label className={labelClass}>{t("basic.passingScore")}</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.passingScore}
                  onChange={(e) => updateForm("passingScore", Number(e.target.value))}
                  className={cn(inputClass, errors.passingScore && "border-red-500")}
                />
                {errors.passingScore && <p className="mt-1 text-sm text-red-500">{errors.passingScore}</p>}
              </div>
            </div>
          </section>
        </FadeIn>
      )}

      {/* Pricing */}
      {activeSection === "pricing" && (
        <FadeIn>
          <section className="p-6 rounded-2xl border border-border bg-surface">
            <h2 className="text-xl font-semibold text-text mb-2">{t("pricing.title")}</h2>
            <p className="text-sm text-text-muted mb-6">
              {t("pricing.description")}
              {globalPrices ? ` ($${(globalPrices.twoAttemptPrice / 100).toFixed(2)} / $${(globalPrices.fourAttemptPrice / 100).toFixed(2)})` : ""}.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t("pricing.twoAttempts")}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={form.twoAttemptPrice}
                    onChange={(e) => updateForm("twoAttemptPrice", e.target.value)}
                    className={cn(inputClass, "pl-8")}
                    placeholder={globalPrices ? String(globalPrices.twoAttemptPrice) : "2900"}
                  />
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {form.twoAttemptPrice ? `$${(Number(form.twoAttemptPrice) / 100).toFixed(2)}` : globalPrices ? `$${(globalPrices.twoAttemptPrice / 100).toFixed(2)} (${t("pricing.global")})` : t("pricing.notSet")}
                </p>
              </div>
              <div>
                <label className={labelClass}>{t("pricing.fourAttempts")}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={form.fourAttemptPrice}
                    onChange={(e) => updateForm("fourAttemptPrice", e.target.value)}
                    className={cn(inputClass, "pl-8")}
                    placeholder={globalPrices ? String(globalPrices.fourAttemptPrice) : "4900"}
                  />
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {form.fourAttemptPrice ? `$${(Number(form.fourAttemptPrice) / 100).toFixed(2)}` : globalPrices ? `$${(globalPrices.fourAttemptPrice / 100).toFixed(2)} (${t("pricing.global")})` : t("pricing.notSet")}
                </p>
              </div>
            </div>
          </section>
        </FadeIn>
      )}

      {/* Options */}
      {activeSection === "options" && (
        <FadeIn>
          <section className="p-6 rounded-2xl border border-border bg-surface">
            <h2 className="text-xl font-semibold text-text mb-6">{t("options.title")}</h2>
            <div className="space-y-4">
              {[
                { field: "enableTimer" as const, label: t("options.enableTimer"), desc: t("options.enableTimerDesc") },
                { field: "shuffleQuestions" as const, label: t("options.shuffleQuestions"), desc: t("options.shuffleQuestionsDesc") },
                { field: "shuffleOptions" as const, label: t("options.shuffleOptions"), desc: t("options.shuffleOptionsDesc") },
                { field: "showCorrectAnswers" as const, label: t("options.showCorrectAnswers"), desc: t("options.showCorrectAnswersDesc") },
                { field: "showScoreImmediately" as const, label: t("options.showScore"), desc: t("options.showScoreDesc") },
                { field: "allowReview" as const, label: t("options.allowReview"), desc: t("options.allowReviewDesc") },
              ].map((opt) => (
                <label key={opt.field} className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/20 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[opt.field]}
                    onChange={(e) => updateForm(opt.field, e.target.checked)}
                    className="mt-0.5 size-5 rounded border-border bg-bg text-primary focus:ring-2 focus:ring-primary/20 shrink-0"
                  />
                  <div>
                    <span className="text-text font-medium">{opt.label}</span>
                    <p className="text-sm text-text-muted mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Questions */}
      {activeSection === "questions" && (
        <FadeIn>
          <section className="p-6 rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-text">{t("questions.title")}</h2>
                <p className="text-sm text-text-muted mt-1">{t("questions.totalPoints", { count: questions.length, points: totalPoints })}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBankModal(true)}
                  className="px-3 py-2 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text hover:border-primary/30 transition-colors flex items-center gap-2"
                >
                  <Search className="size-4" /> {t("questions.fromBank")}
                </button>
                <div className="relative" ref={newQDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowNewQDropdown((v) => !v)}
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
                  >
                    <Plus className="size-4" /> {t("questions.newQuestion")}
                  </button>
                  {showNewQDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-xl shadow-lg py-1 z-10">
                      {QUESTION_TYPES.map((qt) => (
                        <button
                          key={qt}
                          type="button"
                          onClick={() => { addNewQuestion(qt); setShowNewQDropdown(false); }}
                          className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-primary/5 transition-colors"
                        >
                          {t(`questionTypes.${qt}`)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {errors.questions && (
              <p className="mb-4 text-sm text-red-500">{errors.questions}</p>
            )}

            {questions.length === 0 ? (
              <div className="p-12 text-center rounded-xl border-2 border-dashed border-border">
                <HelpCircle className="size-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted mb-2">{t("questions.noQuestions")}</p>
                <p className="text-sm text-text-muted">{t("questions.noQuestionsDesc")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div
                    key={q.tempId}
                    className={cn(
                      "rounded-xl border transition-colors",
                      editingQuestionIdx === idx ? "border-primary bg-primary/5" : "border-border bg-bg hover:border-primary/20"
                    )}
                  >
                    {/* Question Header */}
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} className="p-0.5 text-text-muted hover:text-text disabled:opacity-30"><ChevronUp className="size-3.5" /></button>
                        <button type="button" onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} className="p-0.5 text-text-muted hover:text-text disabled:opacity-30"><ChevronDown className="size-3.5" /></button>
                      </div>
                      <GripVertical className="size-4 text-text-muted shrink-0" />
                      <span className="text-sm font-mono text-text-muted w-8 shrink-0">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {q.text || <span className="italic text-text-muted">{t("questions.untitled")}</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {t(`questionTypes.${q.type}`)}
                          </span>
                          <span className="text-xs text-text-muted">{q.points} {q.points === 1 ? t("questions.points") : t("questions.pointsMultiple")}</span>
                          {q.options.length > 0 && (
                            <span className="text-xs text-text-muted">· {q.options.length} {t("questions.optionsCount")}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestionIdx(editingQuestionIdx === idx ? null : idx);
                          setShowQuestionForm(editingQuestionIdx !== idx);
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors"
                      >
                        {editingQuestionIdx === idx ? t("questions.close") : t("questions.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="p-2 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {/* Expanded Editor */}
                    {editingQuestionIdx === idx && (
                      <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                        <div>
                          <label className={labelClass}>{t("questions.text")}</label>
                          <textarea
                            value={q.text}
                            onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                            rows={3}
                            className={cn(inputClass, "resize-none", errors[`q${idx}_text`] && "border-red-500")}
                            placeholder={t("questions.textPlaceholder")}
                          />
                          {errors[`q${idx}_text`] && <p className="mt-1 text-sm text-red-500">{errors[`q${idx}_text`]}</p>}
                        </div>

                        <div>
                          <label className={labelClass}>{t("questions.explanation")}</label>
                          <textarea
                            value={q.explanation}
                            onChange={(e) => updateQuestion(idx, "explanation", e.target.value)}
                            rows={2}
                            className={cn(inputClass, "resize-none")}
                            placeholder={t("questions.explanationPlaceholder")}
                          />
                        </div>

                        <div className="w-32">
                          <label className={labelClass}>{t("questions.pointsLabel")}</label>
                          <input
                            type="number"
                            min={1}
                            value={q.points}
                            onChange={(e) => updateQuestion(idx, "points", Math.max(1, Number(e.target.value)))}
                            className={cn(inputClass, errors[`q${idx}_points`] && "border-red-500")}
                          />
                        </div>

                        {/* Image Upload */}
                        <div className="md:col-span-2">
                          <label className={labelClass}>{t("questions.image")}</label>
                          {q.image ? (
                            <div className="relative inline-block">
                              <img
                                src={q.image}
                                alt={t("questions.imageAlt")}
                                className="max-h-48 rounded-xl border border-border object-contain"
                              />
                              <div className="absolute top-2 right-2 flex gap-1">
                                <label className="p-1.5 rounded-lg bg-surface/90 border border-border text-text-muted hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors">
                                  <Upload className="size-4" />
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) uploadQuestionImage(idx, file);
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeQuestionImage(idx)}
                                  className="p-1.5 rounded-lg bg-surface/90 border border-border text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/30 bg-bg cursor-pointer transition-colors">
                              <ImageIcon className="size-8 text-text-muted" />
                              <div className="text-center">
                                <span className="text-sm font-medium text-primary">{t("questions.uploadClick")}</span>
                                <span className="text-sm text-text-muted"> {t("questions.uploadDrag")}</span>
                              </div>
                              <span className="text-xs text-text-muted">{t("questions.uploadFormats")}</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadQuestionImage(idx, file);
                                }}
                              />
                            </label>
                          )}
                        </div>

                        {/* Options for MCQ types */}
                        {(q.type === "MCQ_SINGLE" || q.type === "MCQ_MULTIPLE" || q.type === "TRUE_FALSE") && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-medium text-text-muted">
                                {t("questions.answerOptions")} {q.type === "MCQ_SINGLE" ? t("questions.selectOne") : q.type === "MCQ_MULTIPLE" ? t("questions.selectMultiple") : ""}
                              </label>
                              {q.type !== "TRUE_FALSE" && (
                                <button type="button" onClick={() => addOption(idx)} className="text-sm text-primary hover:text-primary-hover flex items-center gap-1">
                                  <Plus className="size-3.5" /> {t("questions.addOption")}
                                </button>
                              )}
                            </div>
                            {(errors[`q${idx}_options`] || errors[`q${idx}_optionsText`] || errors[`q${idx}_correct`]) && (
                              <p className="mb-2 text-sm text-red-500">
                                {errors[`q${idx}_options`] || errors[`q${idx}_optionsText`] || errors[`q${idx}_correct`]}
                              </p>
                            )}
                            <div className="space-y-2">
                              {q.options.map((opt, oi) => (
                                <div key={opt.tempId} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateOption(idx, oi, "isCorrect", true)}
                                    className={cn(
                                      "size-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                      opt.isCorrect
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-border hover:border-primary/30"
                                    )}
                                  >
                                    {opt.isCorrect && <span className="text-xs font-bold">✓</span>}
                                  </button>
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => updateOption(idx, oi, "text", e.target.value)}
                                    className={cn(inputClass, "flex-1 py-2 text-sm")}
                                    placeholder={t("questions.optionPlaceholder", { n: oi + 1 })}
                                    disabled={q.type === "TRUE_FALSE"}
                                  />
                                  {q.type !== "TRUE_FALSE" && q.options.length > 2 && (
                                    <button type="button" onClick={() => removeOption(idx, oi)} className="p-1.5 text-text-muted hover:text-red-500"><Trash2 className="size-3.5" /></button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Short Answer / Numerical - info only */}
                        {(q.type === "SHORT_ANSWER" || q.type === "NUMERICAL") && (
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-sm text-text-muted">
                              {q.type === "SHORT_ANSWER"
                                ? t("questions.shortAnswerInfo")
                                : t("questions.numericalInfo")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </FadeIn>
      )}

      {/* Question Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text">Question Bank</h3>
              <button type="button" onClick={() => { setShowBankModal(false); setBankSearch(""); }} className="p-2 rounded-lg hover:bg-bg transition-colors"><X className="size-5" /></button>
            </div>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
                <input
                  type="text"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className={cn(inputClass, "pl-10")}
                  placeholder="Search questions..."
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredBank.length === 0 ? (
                <p className="text-center text-text-muted py-8">No questions found</p>
              ) : (
                filteredBank.map((q) => (
                  <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{q.text}</p>
                      <p className="text-xs text-text-muted mt-0.5">{q.exam.title} · {q.points} pts · {q.type}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addFromBank(q)}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <FadeIn>
        <div className="flex items-center justify-between p-6 rounded-2xl border border-border bg-surface">
          <button
            type="button"
            onClick={() => window.location.href = `/${locale}/admin/exams`}
            className="px-4 py-2.5 rounded-xl border border-border text-text-muted hover:text-text hover:border-primary/30 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit("DRAFT")}
              disabled={isSubmitting}
              className={cn(
                "px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 border",
                "border-border text-text hover:bg-bg"
              )}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Save as Draft" : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={isSubmitting}
              className={cn(
                "px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2",
                isSubmitting
                  ? "bg-primary/50 text-primary-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary-hover"
              )}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Update & Publish" : "Publish Exam"}
            </button>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

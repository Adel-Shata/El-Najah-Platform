"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteStudentButtonProps {
  studentId: string;
  studentName: string;
  onDelete: (formData: FormData) => Promise<void>;
}

export function DeleteStudentButton({ studentId, studentName, onDelete }: DeleteStudentButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${studentName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    const formData = new FormData();
    formData.append("studentId", studentId);

    startTransition(async () => {
      await onDelete(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        "text-red-600 hover:bg-red-50",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      title="Delete student"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}

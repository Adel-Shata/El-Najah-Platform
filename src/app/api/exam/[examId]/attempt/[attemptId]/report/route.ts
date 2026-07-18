import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateExamReportPDF } from "@/lib/pdf/exam-report";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ examId: string; attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: { options: { orderBy: { order: "asc" } } },
            },
          },
        },
        studentAnswers: {
          include: { question: true },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.userId !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const answersRecord = (attempt.answers ?? {}) as Record<string, string | string[] | boolean>;

    const questionsData = attempt.exam.questions.map((q) => {
      const studentAnswer = answersRecord[q.id] ?? null;
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        points: q.points,
        options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
        studentAnswer,
        isCorrect: null as boolean | null,
        pointsEarned: null as number | null,
      };
    });

    // Hydrate isCorrect and pointsEarned from studentAnswers table
    for (const sa of attempt.studentAnswers) {
      const qd = questionsData.find((q) => q.id === sa.questionId);
      if (qd) {
        qd.isCorrect = sa.isCorrect;
        qd.pointsEarned = sa.pointsEarned;
      }
    }

    const pdfBytes = await generateExamReportPDF({
      user: {
        name: attempt.user.name,
        email: attempt.user.email,
      },
      attempt: {
        id: attempt.id,
        examTitle: attempt.exam.title,
        status: attempt.status,
        percentage: attempt.percentage,
        passed: attempt.passed,
        startedAt: String(attempt.createdAt),
        submittedAt: attempt.submittedAt ? String(attempt.submittedAt) : null,
        score: attempt.score,
        totalPoints: attempt.totalPoints,
      },
      questions: questionsData,
      locale: "en",
    });

    const filename = `exam-report-${attemptId}.pdf`;

    const buffer = Buffer.from(pdfBytes);

    const res = new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf; charset=binary",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff",
      },
    });

    return res;
  } catch (error: any) {
    console.error("PDF report error:", error?.message, error?.stack);
    return NextResponse.json(
      { error: "Failed to generate report", details: error?.message },
      { status: 500 }
    );
  }
}

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface QuestionOptionData {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionReportData {
  id: string;
  text: string;
  type: string;
  points: number;
  options: QuestionOptionData[];
  studentAnswer: string | string[] | boolean | number | null;
  isCorrect: boolean | null;
  pointsEarned: number | null;
}

interface AttemptData {
  id: string;
  examTitle: string;
  status: string;
  percentage: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  totalPoints: number | null;
}

interface UserData {
  name: string | null;
  email: string;
}

interface ExamReportData {
  user: UserData;
  attempt: AttemptData;
  questions: QuestionReportData[];
  locale: "en" | "ar";
}

const COLORS = {
  primary: rgb(0.13, 0.35, 0.71),
  accent: rgb(0.06, 0.6, 0.4),
  red: rgb(0.85, 0.2, 0.2),
  gray: rgb(0.4, 0.4, 0.4),
  lightGray: rgb(0.9, 0.9, 0.9),
  white: rgb(1, 1, 1),
  text: rgb(0.1, 0.1, 0.15),
  textLight: rgb(0.5, 0.5, 0.55),
};

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatDuration(start: string, end: string | null): string {
  try {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  } catch {
    return "-";
  }
}

export async function generateExamReportPDF(data: ExamReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]);
  let { width, height } = page.getSize();

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const contentWidth = width - margin * 2;
  let y = height - margin;

  const { user, attempt, questions, locale } = data;
  const t =
    locale === "ar"
      ? {
          reportTitle: "تقرير نتائج الامتحان",
          studentInfo: "معلومات الطالب",
          examInfo: "معلومات الامتحان",
          results: "النتائج",
          name: "الاسم",
          email: "البريد الإلكتروني",
          examTitle: "عنوان الامتحان",
          status: "الحالة",
          score: "النتيجة",
          percentage: "النسبة المئوية",
          passed: "ناجح",
          failed: "راسب",
          startedAt: "وقت البدء",
          submittedAt: "وقت الإرسال",
          duration: "المدة",
          scoreDetails: "تفاصيل الدرجات",
          earnedPoints: "النقاط المكتسبة",
          totalPoints: "إجمالي النقاط",
          passingScore: "درجة النجاح",
          generatedOn: "تم الإنشاء في",
          footer: "هذا التقرير تم إنشاؤه تلقائياً من منصة النجاح",
          questionReview: "مراجعة الأسئلة",
          question: "سؤال",
          yourAnswer: "إجابتك",
          correctAnswer: "الإجابة الصحيحة",
          correct: "صحيح",
          incorrect: "خطأ",
          pointsEarnedLabel: "النقاط",
          notAnswered: "لم تتم الإجابة",
          trueLabel: "صحيح",
          falseLabel: "خطأ",
        }
      : {
          reportTitle: "Exam Results Report",
          studentInfo: "Student Information",
          examInfo: "Exam Information",
          results: "Results",
          name: "Name",
          email: "Email",
          examTitle: "Exam Title",
          status: "Status",
          score: "Score",
          percentage: "Percentage",
          passed: "Passed",
          failed: "Failed",
          startedAt: "Started At",
          submittedAt: "Submitted At",
          duration: "Duration",
          scoreDetails: "Score Details",
          earnedPoints: "Earned Points",
          totalPoints: "Total Points",
          passingScore: "Passing Score",
          generatedOn: "Generated on",
          footer: "This report was automatically generated from El-Najah Platform",
          questionReview: "Question Review",
          question: "Question",
          yourAnswer: "Your Answer",
          correctAnswer: "Correct Answer",
          correct: "Correct",
          incorrect: "Incorrect",
          pointsEarnedLabel: "Points",
          notAnswered: "Not Answered",
          trueLabel: "True",
          falseLabel: "False",
        };

  const drawText = (
    text: string,
    x: number,
    y: number,
    options: { font?: typeof regularFont; size?: number; color?: ReturnType<typeof rgb>; maxWidth?: number } = {}
  ) => {
    const font = options.font || regularFont;
    const size = options.size || 10;
    const color = options.color || COLORS.text;
    try {
      page.drawText(text, { x, y, size, font, color, maxWidth: options.maxWidth });
    } catch {
      // Skip text that can't be rendered (e.g. unsupported characters)
    }
  };

  const drawLabelValue = (label: string, value: string, x: number, y: number, labelWidth: number = 120) => {
    drawText(label, x, y, { font: boldFont, size: 10, color: COLORS.textLight });
    drawText(value, x + labelWidth, y, { font: regularFont, size: 10, color: COLORS.text });
  };

  // Header
  page.drawRectangle({
    x: margin,
    y: y - 10,
    width: contentWidth,
    height: 80,
    color: COLORS.primary,
  });

  drawText("El-Najah", margin + 20, y + 50, { font: boldFont, size: 28, color: COLORS.white });
  drawText(t.reportTitle, margin + 20, y + 20, { font: regularFont, size: 14, color: COLORS.white });
  drawText(
    `${t.generatedOn} ${formatDate(new Date().toISOString(), locale)}`,
    width - margin - 200,
    y + 50,
    { font: regularFont, size: 9, color: rgb(0.9, 0.9, 1) }
  );

  y -= 100;

  // Student Info
  drawText(t.studentInfo, margin, y, { font: boldFont, size: 14, color: COLORS.primary });
  y -= 30;

  page.drawRectangle({
    x: margin,
    y: y - 60,
    width: contentWidth,
    height: 60,
    color: COLORS.lightGray,
    borderWidth: 1,
    borderColor: rgb(0.8, 0.8, 0.85),
  });

  drawLabelValue(t.name, user.name || "-", margin + 20, y - 20);
  drawLabelValue(t.email, user.email, margin + 20, y - 40);
  y -= 80;

  // Exam Info
  drawText(t.examInfo, margin, y, { font: boldFont, size: 14, color: COLORS.primary });
  y -= 30;

  page.drawRectangle({
    x: margin,
    y: y - 100,
    width: contentWidth,
    height: 100,
    color: COLORS.lightGray,
    borderWidth: 1,
    borderColor: rgb(0.8, 0.8, 0.85),
  });

  drawLabelValue(t.examTitle, attempt.examTitle, margin + 20, y - 20);
  drawLabelValue(
    t.status,
    attempt.passed === true ? t.passed : attempt.passed === false ? t.failed : attempt.status,
    margin + 20,
    y - 40
  );
  drawLabelValue(t.startedAt, formatDate(attempt.startedAt, locale), margin + 20, y - 60);
  drawLabelValue(t.submittedAt, formatDate(attempt.submittedAt, locale), margin + 20, y - 80);
  drawLabelValue(t.duration, formatDuration(attempt.startedAt, attempt.submittedAt), width / 2 + 20, y - 20);
  y -= 120;

  // Results
  drawText(t.results, margin, y, { font: boldFont, size: 14, color: COLORS.primary });
  y -= 30;

  const isPassed = attempt.passed === true;
  const statusColor = isPassed ? COLORS.accent : COLORS.red;
  const statusText = isPassed ? t.passed : t.failed;

  page.drawRectangle({
    x: margin,
    y: y - 80,
    width: contentWidth,
    height: 80,
    color: statusColor,
  });

  drawText(t.percentage, margin + 20, y - 25, { font: regularFont, size: 12, color: COLORS.white });
  drawText(`${attempt.percentage ?? 0}%`, margin + 20, y - 50, { font: boldFont, size: 32, color: COLORS.white });
  drawText(statusText, margin + 20, y - 70, { font: boldFont, size: 14, color: COLORS.white });

  if (attempt.score !== null && attempt.totalPoints !== null) {
    drawText(t.earnedPoints, width / 2 + 50, y - 25, { font: regularFont, size: 12, color: COLORS.white });
    drawText(`${attempt.score} / ${attempt.totalPoints}`, width / 2 + 50, y - 50, {
      font: boldFont,
      size: 24,
      color: COLORS.white,
    });
  }
  y -= 100;

  // Score Details
  if (attempt.score !== null && attempt.totalPoints !== null) {
    drawText(t.scoreDetails, margin, y, { font: boldFont, size: 14, color: COLORS.primary });
    y -= 30;

    const colWidths = [contentWidth * 0.4, contentWidth * 0.2, contentWidth * 0.2, contentWidth * 0.2];
    const colStarts = [margin];
    for (let i = 1; i < colWidths.length; i++) {
      colStarts.push(colStarts[i - 1] + colWidths[i - 1]);
    }

    page.drawRectangle({
      x: margin,
      y: y - 45,
      width: contentWidth,
      height: 30,
      color: COLORS.primary,
    });

    drawText(t.earnedPoints, colStarts[0] + 10, y - 35, { font: boldFont, size: 10, color: COLORS.white });
    drawText(t.totalPoints, colStarts[1] + 10, y - 35, { font: boldFont, size: 10, color: COLORS.white });
    drawText(t.percentage, colStarts[2] + 10, y - 35, { font: boldFont, size: 10, color: COLORS.white });
    drawText(t.passingScore, colStarts[3] + 10, y - 35, { font: boldFont, size: 10, color: COLORS.white });

    page.drawRectangle({
      x: margin,
      y: y - 80,
      width: contentWidth,
      height: 35,
      color: COLORS.white,
    });

    drawText(`${attempt.score}`, colStarts[0] + 10, y - 65, { font: boldFont, size: 12, color: COLORS.text });
    drawText(`${attempt.totalPoints}`, colStarts[1] + 10, y - 65, { font: regularFont, size: 12, color: COLORS.text });
    drawText(`${attempt.percentage ?? 0}%`, colStarts[2] + 10, y - 65, {
      font: boldFont,
      size: 12,
      color: isPassed ? COLORS.accent : COLORS.red,
    });

    y -= 100;
  }

  // Question Review
  drawText(t.questionReview, margin, y, { font: boldFont, size: 14, color: COLORS.primary });
  y -= 25;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    // Check if we need a new page
    if (y < margin + 120) {
      page = pdfDoc.addPage([595.28, 841.89]);
      ({ width, height } = page.getSize());
      y = height - margin;
    }

    const questionText = `${t.question} ${i + 1}: ${q.text}`;
    const truncatedQ = questionText.length > 100 ? questionText.substring(0, 100) + "..." : questionText;
    drawText(truncatedQ, margin, y, { font: boldFont, size: 9, color: COLORS.text, maxWidth: contentWidth });
    y -= 18;

    // Show options for MCQ questions
    if (q.type === "MCQ_SINGLE" || q.type === "MCQ_MULTIPLE" || q.type === "TRUE_FALSE") {
      for (const opt of q.options) {
        const isStudentSelected = Array.isArray(q.studentAnswer)
          ? q.studentAnswer.includes(opt.id)
          : q.studentAnswer === opt.id;
        const marker = isStudentSelected ? "●" : "○";
        const optColor = opt.isCorrect ? COLORS.accent : isStudentSelected ? COLORS.red : COLORS.textLight;
        const prefix = opt.isCorrect ? " ✓" : isStudentSelected ? " ✗" : "";
        const optText = `  ${marker} ${opt.text}${prefix}`;
        const truncatedOpt = optText.length > 90 ? optText.substring(0, 90) + "..." : optText;
        drawText(truncatedOpt, margin, y, { font: regularFont, size: 8, color: optColor, maxWidth: contentWidth });
        y -= 14;
      }
    } else {
      // Short answer / numerical
      const answerStr = q.studentAnswer != null ? String(q.studentAnswer) : t.notAnswered;
      drawText(`${t.yourAnswer}: ${answerStr}`, margin + 10, y, { font: regularFont, size: 8, color: COLORS.text });
      y -= 14;
    }

    // Correct/incorrect + points
    const statusStr = q.isCorrect ? `✓ ${t.correct}` : `✗ ${t.incorrect}`;
    const statusCol = q.isCorrect ? COLORS.accent : COLORS.red;
    drawText(statusStr, margin + 10, y, { font: boldFont, size: 8, color: statusCol });
    drawText(`${t.pointsEarnedLabel}: ${q.pointsEarned ?? 0}/${q.points}`, margin + 120, y, {
      font: regularFont,
      size: 8,
      color: COLORS.textLight,
    });
    y -= 20;
  }

  // Footer
  y = Math.max(y, margin + 50);
  page.drawLine({
    start: { x: margin, y: y - 10 },
    end: { x: width - margin, y: y - 10 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.85),
  });

  drawText(t.footer, margin, y - 30, { font: regularFont, size: 8, color: COLORS.textLight });
  drawText(`${t.generatedOn} ${formatDate(new Date().toISOString(), locale)}`, width - margin - 150, y - 30, {
    font: regularFont,
    size: 8,
    color: COLORS.textLight,
  });

  return pdfDoc.save({ useObjectStreams: false });
}

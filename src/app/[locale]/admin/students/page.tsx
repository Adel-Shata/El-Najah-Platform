import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FadeIn } from "@/components/motion";
import { Users, Mail, Calendar, Ban, CheckCircle, Circle } from "lucide-react";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";

export default async function AdminStudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/auth/signin`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "admin.studentsPage" });

  async function toggleStudentStatus(userId: string, currentStatus: string) {
    "use server";
    await prisma.user.update({
      where: { id: userId },
      data: { status: currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE" },
    });
    revalidatePath(`/${locale}/admin/students`);
  }

  const now = new Date();

  let students: any[] = [];
  try {
    students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        _count: { select: { attempts: true, payments: true } },
        sessions: {
          where: { expires: { gt: now } },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    students = [];
  }

  return (
    <div className="container-app py-8">
      <FadeIn className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
        <p className="text-text-muted mt-1">{t("registeredStudents", { count: students.length })}</p>
      </FadeIn>

      <FadeIn>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {students.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="size-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">{t("noStudents")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg">
                    <th className="text-left px-4 py-3 font-medium text-text-muted">{t("student")}</th>
                    <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">{t("email")}</th>
                    <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">{t("username")}</th>
                    <th className="text-center px-4 py-3 font-medium text-text-muted hidden lg:table-cell">{t("password")}</th>
                    <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">{t("joined")}</th>
                    <th className="text-center px-4 py-3 font-medium text-text-muted">{t("attempts")}</th>
                    <th className="text-center px-4 py-3 font-medium text-text-muted">{t("payments")}</th>
                    <th className="text-center px-4 py-3 font-medium text-text-muted">{t("status")}</th>
                    <th className="text-center px-4 py-3 font-medium text-text-muted">{t("activity")}</th>
                    <th className="text-right px-4 py-3 font-medium text-text-muted">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => {
                    const isOnline = student.sessions.length > 0;
                    return (
                      <tr key={student.id} className="hover:bg-bg/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
                              {student.name?.charAt(0).toUpperCase() || student.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-text truncate">{student.name || t("unnamed")}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Mail className="size-3.5 shrink-0" />
                            <span className="truncate">{student.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-muted hidden lg:table-cell">
                          <span className="truncate">{student.username || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.passwordHash ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {student.passwordHash ? t("hasPassword") : t("noPassword")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 shrink-0" />
                            {format(student.createdAt, "MMM d, yyyy")}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-text">{student._count.attempts}</td>
                        <td className="px-4 py-3 text-center font-medium text-text">{student._count.payments}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : student.status === "SUSPENDED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Circle className={`size-2.5 ${isOnline ? "fill-emerald-500 text-emerald-500" : "fill-gray-400 text-gray-400"}`} />
                            <span className={`text-xs font-medium ${isOnline ? "text-emerald-600" : "text-gray-500"}`}>
                              {isOnline ? t("online") : t("offline")}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <form action={toggleStudentStatus.bind(null, student.id, student.status)} className="inline-block">
                            <button type="submit" className={`p-1.5 rounded-lg transition-colors ${student.status === "ACTIVE" ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`} title={student.status === "ACTIVE" ? t("suspend") : t("activate")}>
                              {student.status === "ACTIVE" ? <Ban className="size-4" /> : <CheckCircle className="size-4" />}
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}

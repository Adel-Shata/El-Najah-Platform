import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FadeIn } from "@/components/motion";
import Link from "next/link";
import { Plus, Edit, Trash2, FolderKanban } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminCategoriesPage({
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

  const t = await getTranslations({ locale, namespace: "admin.categoriesPage" });

  async function createCategory(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;

    if (!name) return;

    await prisma.examCategory.create({
      data: { name, description },
    });
    revalidatePath(`/${locale}/admin/categories`);
  }

  async function deleteCategory(id: string) {
    "use server";
    await prisma.examCategory.delete({ where: { id } });
    revalidatePath(`/${locale}/admin/categories`);
  }

  async function toggleStatus(id: string, currentStatus: string) {
    "use server";
    await prisma.examCategory.update({
      where: { id },
      data: { status: currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });
    revalidatePath(`/${locale}/admin/categories`);
  }

  let categories: any[] = [];
  try {
    categories = await prisma.examCategory.findMany({
      include: { _count: { select: { exams: true } } },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    categories = [];
  }

  return (
    <div className="container-app py-8">
      <FadeIn className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="text-text-muted mt-1">{t("subtitle")}</p>
        </div>
      </FadeIn>

      {/* Create Form */}
      <FadeIn className="mb-8">
        <div className="p-6 rounded-2xl border border-border bg-surface">
          <h2 className="text-lg font-semibold text-text mb-4">{t("newCategory")}</h2>
          <form action={createCategory} className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">{t("name")}</label>
              <input name="name" required className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-bg text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">{t("description")}</label>
              <input name="description" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-bg text-text" />
            </div>
            <div className="md:col-span-3">
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors">
                <Plus className="size-4" /> {t("createCategory")}
              </button>
            </div>
          </form>
        </div>
      </FadeIn>

      {/* Categories List */}
      <FadeIn>
        <div className="space-y-3">
          {categories.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface border border-border text-center">
              <FolderKanban className="size-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">{t("noCategories")}</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FolderKanban className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-text">{cat.name}</p>
                    <p className="text-sm text-text-muted">{cat._count.exams} {t("examsCount")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    {cat.status}
                  </span>
                  <form action={toggleStatus.bind(null, cat.id, cat.status)}>
                    <button type="submit" className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-bg transition-colors text-text-muted">
                      {t("toggleStatus")}
                    </button>
                  </form>
                  <Link href={`/${locale}/admin/categories/${cat.id}/edit`} className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                    <Edit className="size-4" />
                  </Link>
                  <form action={deleteCategory.bind(null, cat.id)}>
                    <button type="submit" className="p-2 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </FadeIn>
    </div>
  );
}

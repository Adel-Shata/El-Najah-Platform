import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.adminSettings.findUnique({
    where: { id: "singleton" },
  });

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();

    const updated = await prisma.adminSettings.upsert({
      where: { id: "singleton" },
      update: {
        twoAttemptPrice: data.twoAttemptPrice,
        fourAttemptPrice: data.fourAttemptPrice,
        whatsappNumber: data.whatsappNumber,
        whatsappEnabled: data.whatsappEnabled,
        whatsappMessage: data.whatsappMessage,
        siteNameEn: data.siteNameEn,
        siteNameAr: data.siteNameAr,
        supportEmail: data.supportEmail,
        maintenanceMode: data.maintenanceMode,
        loginMethod: data.loginMethod,
      },
      create: {
        id: "singleton",
        twoAttemptPrice: data.twoAttemptPrice ?? 2900,
        fourAttemptPrice: data.fourAttemptPrice ?? 4900,
        whatsappNumber: data.whatsappNumber,
        whatsappEnabled: data.whatsappEnabled ?? true,
        whatsappMessage: data.whatsappMessage,
        siteNameEn: data.siteNameEn ?? "El-Najah",
        siteNameAr: data.siteNameAr ?? "النجاح",
        supportEmail: data.supportEmail ?? "support@el-najah.com",
        maintenanceMode: data.maintenanceMode ?? false,
        loginMethod: data.loginMethod ?? "email",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await prisma.adminSettings.findUnique({
      where: { id: "singleton" },
      select: { loginMethod: true },
    });

    return NextResponse.json({ loginMethod: settings?.loginMethod ?? "email" });
  } catch {
    return NextResponse.json({ loginMethod: "email" });
  }
}

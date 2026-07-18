import { prisma } from "./prisma";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true, name: true, passwordHash: true, role: true, status: true },
  });
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: { id: true, email: true, username: true, name: true, passwordHash: true, role: true, status: true },
  });
}

export async function getLoginMethod() {
  const settings = await prisma.adminSettings.findUnique({
    where: { id: "singleton" },
    select: { loginMethod: true },
  });
  return settings?.loginMethod ?? "email";
}

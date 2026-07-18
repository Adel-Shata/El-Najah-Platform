import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Get login method from admin settings
    const settings = await prisma.adminSettings.findUnique({
      where: { id: "singleton" },
      select: { loginMethod: true },
    });
    const loginMethod = settings?.loginMethod ?? "email";

    // Validate username based on login method
    let parsed;
    const usernameRequired = loginMethod === "username" || loginMethod === "both";

    if (usernameRequired) {
      const schema = z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        username: z.string()
          .min(3, "Username must be at least 3 characters")
          .max(30, "Username must be at most 30 characters")
          .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
      }).refine(data => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
      parsed = schema.safeParse(body);
    } else {
      const schema = z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        username: z.string()
          .min(3, "Username must be at least 3 characters")
          .max(30, "Username must be at most 30 characters")
          .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
          .optional()
          .or(z.literal("")),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
      }).refine(data => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
      parsed = schema.safeParse(body);
    }

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, username } = parsed.data;

    // When login method is username (not both), email is auto-generated as placeholder
    const isPlaceholderEmail = loginMethod === "username";
    const finalEmail = isPlaceholderEmail
      ? `${username || name.toLowerCase().replace(/\s+/g, ".")}@el-najah.local`
      : email;

    // Check email uniqueness (skip for placeholder emails)
    if (!finalEmail.endsWith("@el-najah.local")) {
      const existing = await prisma.user.findUnique({ where: { email: finalEmail } });
      if (existing) {
        return NextResponse.json(
          { error: "emailAlreadyExists", field: "email" },
          { status: 409 }
        );
      }
    }

    const finalUsername = username || null;

    // Check username uniqueness
    if (finalUsername) {
      const existingUsername = await prisma.user.findUnique({ where: { username: finalUsername } });
      if (existingUsername) {
        return NextResponse.json(
          { error: "usernameAlreadyExists", field: "username" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: finalEmail,
        username: finalUsername,
        passwordHash,
        role: "STUDENT",
        status: "ACTIVE",
      },
      select: { id: true, email: true, name: true, username: true, role: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Registration failed: ${message}` },
      { status: 500 }
    );
  }
}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.adminSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      twoAttemptPrice: 2900,
      fourAttemptPrice: 4900,
      whatsappEnabled: true,
      siteNameEn: "El-Najah",
      siteNameAr: "النجاح",
      supportEmail: "support@el-najah.com",
      loginMethod: "email",
    },
  });

  const adminHash = await bcrypt.hash("Admin@123456", 12);
  await prisma.user.upsert({
    where: { email: "admin@el-najah.com" },
    update: {},
    create: {
      email: "admin@el-najah.com",
      name: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const studentHash = await bcrypt.hash("Student@123456", 12);
  await prisma.user.upsert({
    where: { email: "student@el-najah.com" },
    update: {},
    create: {
      email: "student@el-najah.com",
      name: "Student",
      passwordHash: studentHash,
      role: "STUDENT",
      status: "ACTIVE",
    },
  });

  console.log("Database seeded successfully!");
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);

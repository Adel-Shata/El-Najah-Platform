import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@el-najah.com",
      name: "Admin",
      passwordHash: hash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("Admin user created:", admin.email);

  const studentHash = await bcrypt.hash("Student@123456", 12);
  const student = await prisma.user.create({
    data: {
      email: "student@el-najah.com",
      name: "Student",
      passwordHash: studentHash,
      role: "STUDENT",
      status: "ACTIVE",
    },
  });
  console.log("Student user created:", student.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

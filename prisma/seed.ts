import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma";


async function main() {
  const passwordHash = await bcrypt.hash("admin1234", 10);

  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: { username: "admin", passwordHash },
  });

  // Seed Organization Categories
  await prisma.orgCategory.createMany({
    data: [
      { name: "Academy" },
      { name: "Bank" },
      { name: "School" },
      { name: "Others" },
    ],
    skipDuplicates: true,
  });

  console.log("Admin and Organization Categories seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
import { prisma } from "../src/config/prisma";

async function main() {
  // Seed Categories
  await prisma.category.createMany({
    data: [
      { name: "Cricket" },
      { name: "Football" },
      { name: "Golf" },
      { name: "Table-Tennis" },
      { name: "Tennis" },
      { name: "Badminton" },
    ],
    skipDuplicates: true,
  });

  // Seed Organization Categories
  await prisma.orgCategory.createMany({
    data: [
      { name: "Profitable" },
      { name: "Non-Profitable" },
    ],
    skipDuplicates: true,
  });

  console.log("Categories and Organization Categories seeded successfully!");
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
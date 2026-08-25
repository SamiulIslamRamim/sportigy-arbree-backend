import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma.js";
import { seedOrganizations } from "./seeds/org.seed";
import { seedSports } from "./seeds/sport.seed";
import { seedCricketMatches } from "./seeds/player-match.seed";


async function main() {
  const passwordHash = await bcrypt.hash("admin1234", 10);
  console.log("admin...")

  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: { username: "admin", passwordHash },
  });

  // Seed Organization Categories
  await seedOrganizations();
  //seed sport, category, field, fieldOption
  await seedSports();
  //Seed Cricket match For ramim
  await seedCricketMatches();

  console.log("DB seeded successfully!");
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
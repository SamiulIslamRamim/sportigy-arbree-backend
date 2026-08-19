import { prisma } from "../../src/config/prisma";

export async function seedOrganizations() {
  const categories = ["Academy", "Bank", "School", "Others"];
  console.log("seeding orgs....")
  for (const name of categories) {
    await prisma.orgCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

import bcrypt from "bcryptjs";
import { db, departmentsTable, usersTable, resourceCategoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const departments = [
    "Housing",
    "Small Business",
    "Homeowner Services",
    "Tenant Organizing",
    "Commercial Development",
    "Administration",
    "Communications",
  ];

  for (const name of departments) {
    const existing = await db
      .select({ id: departmentsTable.id })
      .from(departmentsTable)
      .where(eq(departmentsTable.name, name));

    if (existing.length === 0) {
      await db.insert(departmentsTable).values({ name });
      console.log(`Created department: ${name}`);
    }
  }

  const resourceCategories = [
    "SaaS Tools & Software Subscriptions",
    "External Platforms & Social Accounts",
    "Grants & Funding Sources",
    "Partner Organizations & Contacts",
    "Government Programs & Resources",
    "Physical Assets & Vendor Accounts",
  ];

  for (const name of resourceCategories) {
    const existing = await db
      .select({ id: resourceCategoriesTable.id })
      .from(resourceCategoriesTable)
      .where(eq(resourceCategoriesTable.name, name));

    if (existing.length === 0) {
      await db.insert(resourceCategoriesTable).values({ name, status: "active" });
      console.log(`Created resource category: ${name}`);
    }
  }

  const adminEmail = "admin@impacctbrooklyn.org";
  const existingAdmin = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, adminEmail));

  if (existingAdmin.length === 0) {
    const password_hash = await bcrypt.hash("Admin1234!", 12);
    await db.insert(usersTable).values({
      name: "IMPACCT Admin",
      email: adminEmail,
      password_hash,
      role: "admin",
    });
    console.log(`Created admin user: ${adminEmail} / Admin1234!`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

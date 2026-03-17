import bcrypt from "bcryptjs";
import { db, usersTable, departmentsTable, submissionsTable, statusHistoryTable, resourcesTable, resourceCategoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seedSampleData() {
  console.log("Seeding sample data...");

  const [admin] = await db.select().from(usersTable).where(eq(usersTable.email, "admin@impacctbrooklyn.org"));
  if (!admin) throw new Error("Admin user not found — run seed.ts first");

  const depts = await db.select().from(departmentsTable);
  const deptMap: Record<string, number> = {};
  for (const d of depts) deptMap[d.name] = d.id;

  const cats = await db.select().from(resourceCategoriesTable).where(eq(resourceCategoriesTable.status, "active"));
  const catMap: Record<string, number> = {};
  for (const c of cats) catMap[c.name] = c.id;

  // Create department staff users
  const staffUsers: { name: string; email: string; role: string; dept: string }[] = [
    { name: "Maria Santos",   email: "maria@impacctbrooklyn.org",  role: "department_head", dept: "Communications" },
    { name: "David Chen",    email: "david@impacctbrooklyn.org",   role: "department_head", dept: "Small Business" },
    { name: "Asha Patel",    email: "asha@impacctbrooklyn.org",    role: "staff",           dept: "Tenant Organizing" },
    { name: "Marcus Brown",  email: "marcus@impacctbrooklyn.org",  role: "department_head", dept: "Homeowner Services" },
    { name: "Elena Vasquez", email: "elena@impacctbrooklyn.org",   role: "staff",           dept: "Housing" },
  ];

  const userIdMap: Record<string, number> = {};
  const pw = await bcrypt.hash("Staff1234!", 12);
  for (const u of staffUsers) {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, u.email));
    if (existing.length > 0) {
      userIdMap[u.name] = existing[0]!.id;
      console.log(`User already exists: ${u.email}`);
      continue;
    }
    const [created] = await db.insert(usersTable).values({
      name: u.name,
      email: u.email,
      password_hash: pw,
      role: u.role,
      department_id: deptMap[u.dept] ?? null,
    }).returning();
    userIdMap[u.name] = created!.id;
    console.log(`Created user: ${u.email}`);
  }

  // Also map Jordan (Housing dept head from earlier)
  const [jordan] = await db.select().from(usersTable).where(eq(usersTable.email, "jordan@impacctbrooklyn.org"));
  if (jordan) userIdMap["Jordan Williams"] = jordan.id;

  const submitterFor = (dept: string, role: string): number => {
    if (dept === "Housing") return userIdMap["Jordan Williams"] ?? admin.id;
    if (dept === "Communications") return userIdMap["Maria Santos"] ?? admin.id;
    if (dept === "Small Business") return userIdMap["David Chen"] ?? admin.id;
    if (dept === "Tenant Organizing") return userIdMap["Asha Patel"] ?? admin.id;
    if (dept === "Homeowner Services") return userIdMap["Marcus Brown"] ?? admin.id;
    return admin.id;
  };

  // Sample submissions
  const submissions = [
    {
      dept: "Communications",
      content_type: "event",
      headline: "Annual Community Block Party — Save the Date",
      body: "Join us for the IMPACCT Brooklyn Annual Community Block Party on Saturday, April 12th from 12–6pm at Marcus Garvey Park. This free event will feature live music, food vendors, community organizations tabling, and activities for kids of all ages. Residents from all neighborhoods are welcome. This is a great opportunity to connect with neighbors and learn about the programs and services available to you.",
      link: "https://impacctbrooklyn.org/block-party-2026",
      requested_publish_date: "2026-03-28",
      status: "published",
    },
    {
      dept: "Housing",
      content_type: "program_update",
      headline: "Expanded Rental Assistance Program — Applications Now Open",
      body: "IMPACCT Brooklyn is pleased to announce that the Rental Assistance Program has been expanded to serve households earning up to 80% AMI, up from 60% AMI previously. Eligible residents can apply for up to 3 months of back-rent relief. Applications are open through April 30, 2026. Staff are available Monday–Friday 9am–5pm to assist with the application process. Walk-ins welcome at our Bedford-Stuyvesant office.",
      link: "https://impacctbrooklyn.org/rental-assistance",
      attachment_url: "https://docs.impacctbrooklyn.org/rental-assistance-flyer-2026.pdf",
      requested_publish_date: "2026-03-20",
      status: "published",
    },
    {
      dept: "Small Business",
      content_type: "event",
      headline: "Free Small Business Legal Clinic — April 3rd",
      body: "The Small Business Development team is hosting a free legal clinic for local entrepreneurs and small business owners. An attorney from the NYC Bar Association's Volunteer Lawyers for the Arts will be on hand to answer questions about contracts, leases, LLC formation, and intellectual property. Appointments are 30 minutes and must be booked in advance. Space is limited to 12 participants.",
      link: "https://impacctbrooklyn.org/legal-clinic-april",
      requested_publish_date: "2026-03-22",
      status: "pending",
    },
    {
      dept: "Tenant Organizing",
      content_type: "news",
      headline: "Know Your Rights: Heat & Hot Water Season Reminder",
      body: "Heat season runs October 1st through May 31st. During this period, landlords are legally required to maintain indoor temperatures of at least 68°F between 6am and 10pm when outdoor temperatures fall below 55°F, and at least 62°F overnight when outdoor temps fall below 40°F. Hot water must be provided year-round at a minimum of 120°F. If your landlord is not complying, call 311 to file a complaint and contact our Tenant Organizing team — we can help you document violations and take action.",
      link: "https://www.nyc.gov/site/hpd/renters/heat-and-hot-water.page",
      requested_publish_date: "2026-03-18",
      status: "needs_revision",
    },
    {
      dept: "Homeowner Services",
      content_type: "resource",
      headline: "NYC Department of Buildings: Homeowner Resources Hub",
      body: "We are sharing this link to the NYC Department of Buildings Homeowner Resources page as a reference for clients. Includes guides on permits, contractor verification, emergency repair programs, and the Alternative Enforcement Program (AEP). Recommend adding this to the Resources section of the portal and linking from the Homeowner Services page on our website.",
      link: "https://www.nyc.gov/site/buildings/homeowner/homeowner.page",
      requested_publish_date: "2026-03-25",
      status: "pending",
    },
    {
      dept: "Housing",
      content_type: "staff_change",
      headline: "Welcome — New Housing Intake Coordinator",
      body: "We are excited to welcome Priya Ramamurthy to the Housing team as our new Intake Coordinator. Priya comes to us from the Brooklyn Legal Services Corporation A, where she worked as a housing case manager for five years. She will be the first point of contact for new clients seeking rental assistance, housing court support, and relocation services. Her first day is March 24th. Please join us in welcoming her to the IMPACCT family.",
      requested_publish_date: "2026-03-24",
      status: "pending",
    },
    {
      dept: "Communications",
      content_type: "news",
      headline: "IMPACCT Brooklyn Featured in City Limits Housing Coverage",
      body: "IMPACCT Brooklyn's Executive Director was quoted in a recent City Limits article examining the impact of community land trusts on long-term housing affordability in Central Brooklyn. The article explores how permanently affordable housing models help stabilize neighborhoods facing displacement pressures. We will share the link to the full article across our social channels once it is live. Requesting this be posted to the News section of our website.",
      link: "https://citylimits.org/impacct-brooklyn-community-land-trust",
      requested_publish_date: "2026-04-01",
      status: "published",
    },
  ];

  const createdIds: number[] = [];

  for (const s of submissions) {
    const [sub] = await db.insert(submissionsTable).values({
      department_id: deptMap[s.dept]!,
      submitted_by: submitterFor(s.dept, "department_head"),
      content_type: s.content_type,
      headline: s.headline,
      body: s.body,
      link: s.link ?? null,
      attachment_url: (s as any).attachment_url ?? null,
      requested_publish_date: s.requested_publish_date ?? null,
      status: s.status,
      published_at: s.status === "published" ? new Date() : null,
    }).returning();
    createdIds.push(sub!.id);
    console.log(`Created submission: "${s.headline}" (${s.status})`);

    // Add initial status history entry
    await db.insert(statusHistoryTable).values({
      submission_id: sub!.id,
      changed_by: submitterFor(s.dept, "department_head"),
      old_status: null,
      new_status: "pending",
      note: null,
    });

    // If published or needs_revision, add admin review history
    if (s.status === "published") {
      await db.insert(statusHistoryTable).values({
        submission_id: sub!.id,
        changed_by: admin.id,
        old_status: "pending",
        new_status: "published",
        note: "Approved and published. Great work!",
      });
    } else if (s.status === "needs_revision") {
      await db.insert(statusHistoryTable).values({
        submission_id: sub!.id,
        changed_by: admin.id,
        old_status: "pending",
        new_status: "needs_revision",
        note: "Please add the specific temperatures in Fahrenheit and Celsius, and clarify whether the 311 complaint process applies to NYCHA residents as well.",
      });
      await db.update(submissionsTable).set({
        admin_notes: "Please add the specific temperatures in Fahrenheit and Celsius, and clarify whether the 311 complaint process applies to NYCHA residents as well.",
      }).where(eq(submissionsTable.id, sub!.id));
    }
  }

  // Sample resources
  const resources = [
    {
      name: "Canva for Nonprofits",
      cat: "SaaS Tools & Software Subscriptions",
      description: "Design platform for creating social media graphics, flyers, presentations, and print materials. Free nonprofit plan includes premium features.",
      url: "https://www.canva.com/nonprofit/",
      login_info_location: "1Password — Shared Vault > Communications",
      access_level: "everyone",
      cost: "Free (nonprofit plan)",
      renewal_date: "2026-11-30",
      notes: "Contact Maria in Communications before creating new brand assets to ensure consistency.",
    },
    {
      name: "Mailchimp",
      cat: "External Platforms & Social Accounts",
      description: "Email marketing platform used for our monthly community newsletter and event announcements. Currently on the Essentials plan.",
      url: "https://mailchimp.com",
      login_info_location: "1Password — Shared Vault > Communications",
      access_level: "department",
      cost: "$20/month",
      renewal_date: "2026-07-01",
      notes: "Only Communications and Administration staff should send mass emails. Contact Maria for access.",
    },
    {
      name: "NYC HPD Affordable Housing Connect",
      cat: "Government Programs & Resources",
      description: "Official NYC portal for affordable housing lotteries and applications. Use this to refer clients looking for income-restricted apartments.",
      url: "https://housingconnect.nyc.gov",
      access_level: "everyone",
      cost: "Free",
      notes: "Bookmark this — we reference it constantly for Housing and Homeowner Services clients.",
    },
    {
      name: "NYC Small Business Services — Business Toolbox",
      cat: "Government Programs & Resources",
      description: "NYC SBS resource hub covering business registration, licensing, loans, and training programs. Useful for client referrals in the Small Business program.",
      url: "https://www.nyc.gov/site/sbs/businesses/business-toolbox.page",
      access_level: "everyone",
      cost: "Free",
    },
    {
      name: "Fluxx Grantee Portal",
      cat: "Grants & Funding Sources",
      description: "Grant management platform used to submit reports and track deliverables for several foundation funders. Check here for report due dates.",
      url: "https://impacctbrooklyn.fluxx.io",
      login_info_location: "1Password — Admin Vault > Grants",
      access_level: "leadership",
      cost: "Included in grant agreements",
      renewal_date: "2026-12-31",
      notes: "Access is limited to ED, Deputy Director, and Program Directors. Contact admin for reporting deadlines.",
    },
    {
      name: "Google Workspace (Admin Console)",
      cat: "SaaS Tools & Software Subscriptions",
      description: "Admin access to manage IMPACCT Brooklyn email accounts, Drive storage, and user permissions. Do not use this unless you are an IT admin.",
      url: "https://admin.google.com",
      login_info_location: "1Password — Admin Vault > IT",
      access_level: "leadership",
      cost: "$6/user/month (Nonprofit discounted)",
      renewal_date: "2026-06-30",
    },
    {
      name: "BankruptcyPRO — Tenant Legal Services",
      cat: "Partner Organizations & Contacts",
      description: "Partner org providing pro bono legal representation for tenants facing eviction in Brooklyn Housing Court. Refer clients who need legal counsel and do not qualify for Legal Aid.",
      url: "https://www.bankruptcypro.org",
      access_level: "everyone",
      cost: "Free to clients (pro bono)",
      notes: "Best intake contact: intake@bankruptcypro.org or (718) 555-0142. Warm referrals preferred — call before sending a client.",
    },
  ];

  for (const r of resources) {
    const existing = await db.select().from(resourcesTable).where(eq(resourcesTable.name, r.name));
    if (existing.length > 0) {
      console.log(`Resource already exists: ${r.name}`);
      continue;
    }
    await db.insert(resourcesTable).values({
      name: r.name,
      category_id: catMap[r.cat]!,
      description: r.description ?? null,
      url: r.url ?? null,
      login_info_location: r.login_info_location ?? null,
      access_level: r.access_level as "everyone" | "department" | "leadership",
      cost: r.cost ?? null,
      renewal_date: r.renewal_date ?? null,
      added_by: admin.id,
      notes: r.notes ?? null,
    });
    console.log(`Created resource: ${r.name}`);
  }

  // Add a pending category suggestion
  const existingPending = await db.select().from(resourceCategoriesTable)
    .where(eq(resourceCategoriesTable.name, "Training & Professional Development"));
  if (existingPending.length === 0) {
    await db.insert(resourceCategoriesTable).values({
      name: "Training & Professional Development",
      status: "pending",
      suggested_by: userIdMap["Maria Santos"] ?? admin.id,
    });
    console.log("Created pending category suggestion: Training & Professional Development");
  }

  console.log("\nSample data seeding complete.");
  process.exit(0);
}

seedSampleData().catch((err) => {
  console.error("Sample data seed failed:", err);
  process.exit(1);
});

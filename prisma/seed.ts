import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed LegisCore.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const institution = await db.institution.upsert({
    where: { slug: "legiscore-demonstration" },
    update: {},
    create: {
      id: "inst_legiscore_demo",
      name: "LegisCore Demonstration Institution",
      slug: "legiscore-demonstration",
      type: "PLATFORM",
      description: "Non-official workspace for development and verification testing.",
      isOfficial: false,
    },
  });

  const senate = await db.chamber.upsert({
    where: { institutionId_code: { institutionId: institution.id, code: "SENATE" } },
    update: {},
    create: { id: "chamber_demo_senate", institutionId: institution.id, code: "SENATE", name: "Senate demonstration chamber" },
  });
  const house = await db.chamber.upsert({
    where: { institutionId_code: { institutionId: institution.id, code: "HOUSE" } },
    update: {},
    create: { id: "chamber_demo_house", institutionId: institution.id, code: "HOUSE", name: "House demonstration chamber" },
  });

  const session = await db.assemblySession.upsert({
    where: { id: "session_demo_2026" },
    update: {},
    create: {
      id: "session_demo_2026",
      institutionId: institution.id,
      name: "2026 demonstration session",
      startsOn: new Date("2026-01-01T00:00:00.000Z"),
      endsOn: new Date("2026-12-31T23:59:59.000Z"),
      isCurrent: true,
    },
  });

  const source = await db.sourceDocument.upsert({
    where: { documentId: "LEGISCORE-DEMO-INTAKE-001" },
    update: {},
    create: {
      id: "source_demo_intake",
      institutionId: institution.id,
      documentId: "LEGISCORE-DEMO-INTAKE-001",
      title: "Demonstration bill intake evidence",
      type: "EVIDENCE",
      verification: "UNVERIFIED",
      accessLevel: "INSTITUTIONAL",
      isDemonstration: true,
      versions: {
        create: {
          versionNumber: 1,
          integrityHash: "DEMONSTRATION-NOT-A-CRYPTOGRAPHIC-SOURCE-HASH",
          changeSummary: "Bootstrap placeholder; replace with uploaded and hashed evidence.",
        },
      },
    },
  });

  const appwriteUserId = process.env.LEGISCORE_SEED_APPWRITE_USER_ID;
  const email = process.env.LEGISCORE_SEED_ADMIN_EMAIL;
  if (appwriteUserId && email) {
    const user = await db.user.upsert({
      where: { appwriteUserId },
      update: { email, status: "ACTIVE" },
      create: {
        id: "user_seed_admin",
        appwriteUserId,
        email,
        displayName: "LegisCore seed administrator",
        status: "ACTIVE",
        emailVerified: false,
      },
    });
    await db.roleAssignment.upsert({
      where: { userId_institutionId_role: { userId: user.id, institutionId: institution.id, role: "INSTITUTION_ADMIN" } },
      update: {},
      create: { userId: user.id, institutionId: institution.id, role: "INSTITUTION_ADMIN" },
    });
  }

  console.log(JSON.stringify({ institutionId: institution.id, senateId: senate.id, houseId: house.id, sessionId: session.id, sourceDocumentId: source.id }));
}

main().finally(() => db.$disconnect());

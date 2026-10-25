import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/config/env";
import { ApiAccessError, requireAppwriteIdentity } from "@/lib/auth/api-actor";
import { getDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED", message: "PostgreSQL is not connected." }, { status: 503 });
  try {
    const appwriteUserId = await requireAppwriteIdentity(request);
    const assignments = await getDatabase().roleAssignment.findMany({
      where: {
        user: { appwriteUserId, status: "ACTIVE" },
        role: { in: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "LEGISLATOR", "LEGISLATIVE_CLERK"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { institution: { name: "asc" } },
      select: {
        role: true,
        institution: {
          select: {
            id: true,
            name: true,
            sessions: { where: { isCurrent: true }, orderBy: { startsOn: "desc" }, select: { id: true, name: true } },
            documents: {
              where: { type: { in: ["BILL", "EVIDENCE"] }, accessLevel: { in: ["INSTITUTIONAL", "RESTRICTED"] } },
              orderBy: { updatedAt: "desc" },
              take: 50,
              select: { id: true, title: true, documentId: true, verification: true },
            },
          },
        },
      },
    });
    return NextResponse.json({ data: assignments });
  } catch (error) {
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}

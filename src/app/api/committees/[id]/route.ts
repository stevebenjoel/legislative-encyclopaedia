import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/config/env";
import { ApiAccessError, requireApiActor } from "@/lib/auth/api-actor";
import { can } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/db";

export async function GET(request: NextRequest, context: RouteContext<"/api/committees/[id]">) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    if (!can(actor.role, "workflow:read")) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const { id } = await context.params;
    const db = getDatabase();
    const committee = await db.committee.findFirst({
      where: { id, institutionId: actor.institutionId },
      select: {
        id: true, name: true, slug: true, mandate: true, isActive: true,
        chamber: { select: { id: true, name: true, code: true } },
        meetings: { orderBy: { startsAt: "desc" }, take: 50, select: { id: true, title: true, startsAt: true, venue: true, virtualLink: true, agenda: true, isOfficialSitting: true, accessLevel: true, participants: { select: { attended: true, user: { select: { id: true, displayName: true, email: true } } } }, minutes: { select: { id: true, status: true } } } },
        workflowTasks: { where: { status: { notIn: ["COMPLETED", "CANCELLED"] } }, orderBy: { dueAt: "asc" }, take: 25, select: { id: true, title: true, status: true, priority: true, dueAt: true } },
        referrals: { orderBy: { referralDate: "desc" }, take: 25, select: { id: true, referralDate: true, expectedReportDate: true, verification: true, bill: { select: { id: true, billNumber: true, title: true } } } },
        _count: { select: { hearings: true, reports: true, meetings: true, workflowTasks: true } },
      },
    });
    if (!committee) return NextResponse.json({ error: "COMMITTEE_NOT_FOUND" }, { status: 404 });
    const [members] = await Promise.all([
      can(actor.role, "workflow:manage") ? db.user.findMany({ where: { status: "ACTIVE", roles: { some: { institutionId: actor.institutionId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } } }, orderBy: { displayName: "asc" }, select: { id: true, displayName: true, email: true } }) : Promise.resolve([]),
    ]);
    return NextResponse.json({ data: committee, meta: { canManage: can(actor.role, "workflow:manage"), members } });
  } catch (error) {
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}


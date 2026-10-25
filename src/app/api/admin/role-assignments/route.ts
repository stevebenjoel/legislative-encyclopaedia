import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { serverEnv } from "@/config/env";
import { ApiAccessError, requireApiActor } from "@/lib/auth/api-actor";
import { can, canGrantRole, roles } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/db";

const assignmentSchema = z.object({ email: z.email(), role: z.enum(roles) });

export async function GET(request: NextRequest) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED", message: "PostgreSQL is not connected." }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    if (!can(actor.role, "institution:manage")) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const assignments = await getDatabase().roleAssignment.findMany({
      where: { institutionId: actor.institutionId },
      orderBy: [{ user: { displayName: "asc" } }, { role: "asc" }],
      select: { id: true, role: true, grantedAt: true, expiresAt: true, user: { select: { id: true, displayName: true, email: true, emailVerified: true, status: true } } },
    });
    return NextResponse.json({ data: assignments });
  } catch (error) {
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED", message: "PostgreSQL is not connected." }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    if (!can(actor.role, "institution:manage")) return NextResponse.json({ error: "FORBIDDEN", message: "This role cannot manage institutional membership." }, { status: 403 });
    const input = assignmentSchema.parse(await request.json());
    if (!canGrantRole(actor.role, input.role)) return NextResponse.json({ error: "PRIVILEGE_ESCALATION_BLOCKED", message: "You cannot grant this administrative role." }, { status: 403 });
    const db = getDatabase();
    const user = await db.user.findUnique({ where: { email: input.email }, select: { id: true, displayName: true, email: true, status: true } });
    if (!user) return NextResponse.json({ error: "USER_NOT_SYNCHRONIZED", message: "The user must sign in once before a role can be assigned." }, { status: 404 });
    if (user.status !== "ACTIVE") return NextResponse.json({ error: "USER_NOT_ACTIVE", message: "The user account is not active." }, { status: 409 });
    const assignment = await db.$transaction(async (tx) => {
      const created = await tx.roleAssignment.upsert({
        where: { userId_institutionId_role: { userId: user.id, institutionId: actor.institutionId, role: input.role } },
        update: { expiresAt: null },
        create: { userId: user.id, institutionId: actor.institutionId, role: input.role, grantedById: actor.userId },
        select: { id: true, role: true, grantedAt: true },
      });
      await tx.auditEvent.create({ data: { institutionId: actor.institutionId, actorId: actor.userId, eventType: "ROLE_ASSIGNED", entityType: "RoleAssignment", entityId: created.id, metadata: { targetUserId: user.id, targetEmail: user.email, role: input.role } } });
      return created;
    });
    return NextResponse.json({ data: { ...assignment, user }, message: `${input.role.replaceAll("_", " ")} assigned to ${user.displayName}.` }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "VALIDATION_ERROR", issues: error.issues }, { status: 422 });
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}

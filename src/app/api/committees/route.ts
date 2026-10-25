import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { serverEnv } from "@/config/env";
import { ApiAccessError, requireApiActor } from "@/lib/auth/api-actor";
import { can } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/db";
import { createCommitteeSchema } from "@/lib/validation/committees";

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED", message: "PostgreSQL is not connected." }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    if (!can(actor.role, "workflow:read")) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const manageable = can(actor.role, "committee:manage");
    const db = getDatabase();
    const [committees, chambers] = await Promise.all([
      db.committee.findMany({
        where: { institutionId: actor.institutionId, isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true, name: true, slug: true, mandate: true, isActive: true,
          chamber: { select: { id: true, name: true, code: true } },
          _count: { select: { referrals: true, hearings: true, reports: true, workflowTasks: true, meetings: true } },
          meetings: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 1, select: { id: true, title: true, startsAt: true } },
        },
      }),
      db.chamber.findMany({ where: { institutionId: actor.institutionId }, orderBy: { name: "asc" }, select: { id: true, name: true, code: true } }),
    ]);
    return NextResponse.json({ data: committees, meta: { canManage: manageable, chambers } });
  } catch (error) {
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    if (!can(actor.role, "committee:manage")) return NextResponse.json({ error: "FORBIDDEN", message: "This role cannot create committees." }, { status: 403 });
    const input = createCommitteeSchema.parse(await request.json());
    const db = getDatabase();
    if (input.chamberId) {
      const chamber = await db.chamber.findFirst({ where: { id: input.chamberId, institutionId: actor.institutionId }, select: { id: true } });
      if (!chamber) return NextResponse.json({ error: "INVALID_CHAMBER", message: "The selected chamber is outside this institution." }, { status: 422 });
    }
    const slug = slugify(input.name);
    if (!slug) return NextResponse.json({ error: "INVALID_NAME", message: "The committee name cannot produce a valid identifier." }, { status: 422 });
    const exists = await db.committee.findUnique({ where: { institutionId_slug: { institutionId: actor.institutionId, slug } }, select: { id: true } });
    if (exists) return NextResponse.json({ error: "COMMITTEE_EXISTS", message: "A committee with this name already exists in the institution." }, { status: 409 });
    const committee = await db.$transaction(async (tx) => {
      const created = await tx.committee.create({ data: { institutionId: actor.institutionId, chamberId: input.chamberId, name: input.name, slug, mandate: input.mandate }, select: { id: true, name: true, slug: true } });
      await tx.auditEvent.create({ data: { institutionId: actor.institutionId, actorId: actor.userId, eventType: "COMMITTEE_CREATED", entityType: "Committee", entityId: created.id, metadata: { name: input.name, chamberId: input.chamberId, mandate: input.mandate } } });
      return created;
    });
    return NextResponse.json({ data: committee, message: "Internal committee workspace created. It is not represented as an official parliamentary committee." }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "VALIDATION_ERROR", issues: error.issues }, { status: 422 });
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}


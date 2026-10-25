import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { serverEnv } from "@/config/env";
import { ApiAccessError, requireApiActor } from "@/lib/auth/api-actor";
import { can } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/db";
import { createCorrespondenceSchema } from "@/lib/validation/correspondence";

export async function GET(request: NextRequest) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED", message: "PostgreSQL is not connected." }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    if (!can(actor.role, "workflow:read")) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const manageable = can(actor.role, "workflow:manage");
    const db = getDatabase();
    const [records, members] = await Promise.all([
      db.correspondence.findMany({
        where: { institutionId: actor.institutionId, ...(!manageable ? { assignedToId: actor.userId } : {}) },
        orderBy: [{ archivedAt: "asc" }, { responseDueAt: "asc" }, { receivedOrSentAt: "desc" }],
        take: 200,
        select: { id: true, referenceNumber: true, direction: true, subject: true, senderOrRecipient: true, summary: true, classification: true, status: true, receivedOrSentAt: true, responseDueAt: true, responseDraft: true, archivedAt: true, updatedAt: true, assignedTo: { select: { id: true, displayName: true, email: true } } },
      }),
      manageable ? db.user.findMany({ where: { status: "ACTIVE", roles: { some: { institutionId: actor.institutionId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } } }, orderBy: { displayName: "asc" }, select: { id: true, displayName: true, email: true } }) : Promise.resolve([]),
    ]);
    return NextResponse.json({ data: records, meta: { canManage: manageable, actorUserId: actor.userId, members } });
  } catch (error) {
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    if (!can(actor.role, "workflow:manage")) return NextResponse.json({ error: "FORBIDDEN", message: "This role cannot register institutional correspondence." }, { status: 403 });
    const input = createCorrespondenceSchema.parse(await request.json());
    const db = getDatabase();
    if (input.assignedToId) {
      const assignee = await db.user.findFirst({ where: { id: input.assignedToId, status: "ACTIVE", roles: { some: { institutionId: actor.institutionId } } }, select: { id: true } });
      if (!assignee) return NextResponse.json({ error: "INVALID_ASSIGNEE", message: "The responsible officer must be active in this institution." }, { status: 422 });
    }
    const duplicate = await db.correspondence.findUnique({ where: { institutionId_referenceNumber: { institutionId: actor.institutionId, referenceNumber: input.referenceNumber } }, select: { id: true } });
    if (duplicate) return NextResponse.json({ error: "REFERENCE_EXISTS", message: "This correspondence reference number already exists." }, { status: 409 });
    const record = await db.$transaction(async (tx) => {
      const created = await tx.correspondence.create({ data: { institutionId: actor.institutionId, referenceNumber: input.referenceNumber, direction: input.direction, subject: input.subject, senderOrRecipient: input.senderOrRecipient, summary: input.summary, classification: input.classification, receivedOrSentAt: new Date(input.receivedOrSentAt), responseDueAt: input.responseDueAt ? new Date(input.responseDueAt) : undefined, assignedToId: input.assignedToId, status: input.assignedToId ? "ASSIGNED" : "REGISTERED" }, select: { id: true, referenceNumber: true, status: true } });
      if (input.assignedToId) await tx.notification.create({ data: { userId: input.assignedToId, type: "CORRESPONDENCE_ASSIGNED", title: "Correspondence assigned", message: `${input.referenceNumber}: ${input.subject}` } });
      await tx.auditEvent.create({ data: { institutionId: actor.institutionId, actorId: actor.userId, eventType: "CORRESPONDENCE_REGISTERED", entityType: "Correspondence", entityId: created.id, metadata: { referenceNumber: input.referenceNumber, direction: input.direction, classification: input.classification, assignedToId: input.assignedToId } } });
      return created;
    });
    return NextResponse.json({ data: record, message: "Institutional correspondence registered and audited." }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "VALIDATION_ERROR", issues: error.issues }, { status: 422 });
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}


import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { serverEnv } from "@/config/env";
import { ApiAccessError, requireApiActor } from "@/lib/auth/api-actor";
import { can } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/db";
import { correspondenceActionSchema } from "@/lib/validation/correspondence";

export async function PATCH(request: NextRequest, context: RouteContext<"/api/correspondence/[id]">) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    const { id } = await context.params;
    const input = correspondenceActionSchema.parse(await request.json());
    const db = getDatabase();
    const record = await db.correspondence.findUnique({ where: { id }, select: { id: true, institutionId: true, referenceNumber: true, subject: true, status: true, assignedToId: true, responseDraft: true } });
    if (!record) return NextResponse.json({ error: "CORRESPONDENCE_NOT_FOUND" }, { status: 404 });
    if (record.institutionId !== actor.institutionId) return NextResponse.json({ error: "INSTITUTION_MISMATCH" }, { status: 403 });
    const manager = can(actor.role, "workflow:manage");
    const responsible = record.assignedToId === actor.userId;
    if (["ASSIGN", "ARCHIVE", "REOPEN"].includes(input.action) && !manager) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    if (["SAVE_RESPONSE", "MARK_RESPONDED"].includes(input.action) && !manager && !responsible) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const result = await db.$transaction(async (tx) => {
      let data: { assignedToId?: string; responseDraft?: string; status?: "REGISTERED" | "ASSIGNED" | "DRAFTING_RESPONSE" | "RESPONDED" | "ARCHIVED"; archivedAt?: Date | null } = {};
      if (input.action === "ASSIGN") {
        const assignee = await tx.user.findFirst({ where: { id: input.assignedToId, status: "ACTIVE", roles: { some: { institutionId: actor.institutionId } } }, select: { id: true } });
        if (!assignee) throw new Error("INVALID_ASSIGNEE");
        data = { assignedToId: assignee.id, status: "ASSIGNED", archivedAt: null };
        await tx.notification.create({ data: { userId: assignee.id, type: "CORRESPONDENCE_ASSIGNED", title: "Correspondence assigned", message: `${record.referenceNumber}: ${record.subject}` } });
      } else if (input.action === "SAVE_RESPONSE") data = { responseDraft: input.responseDraft, status: "DRAFTING_RESPONSE" };
      else if (input.action === "MARK_RESPONDED") {
        if (!record.responseDraft) throw new Error("RESPONSE_DRAFT_REQUIRED");
        data = { status: "RESPONDED" };
      } else if (input.action === "ARCHIVE") data = { status: "ARCHIVED", archivedAt: new Date() };
      else if (input.action === "REOPEN") data = { status: record.assignedToId ? "ASSIGNED" : "REGISTERED", archivedAt: null };
      const updated = await tx.correspondence.update({ where: { id }, data, select: { id: true, status: true, assignedToId: true, archivedAt: true, updatedAt: true } });
      await tx.auditEvent.create({ data: { institutionId: actor.institutionId, actorId: actor.userId, eventType: `CORRESPONDENCE_${input.action}`, entityType: "Correspondence", entityId: id, metadata: { previousStatus: record.status, status: updated.status, assignedToId: updated.assignedToId } } });
      return updated;
    });
    return NextResponse.json({ data: result, message: "Correspondence workflow updated and audited." });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "VALIDATION_ERROR", issues: error.issues }, { status: 422 });
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    if (error instanceof Error && error.message === "INVALID_ASSIGNEE") return NextResponse.json({ error: error.message, message: "The responsible officer must be active in this institution." }, { status: 422 });
    if (error instanceof Error && error.message === "RESPONSE_DRAFT_REQUIRED") return NextResponse.json({ error: error.message, message: "Save a response draft before marking correspondence as responded." }, { status: 409 });
    throw error;
  }
}


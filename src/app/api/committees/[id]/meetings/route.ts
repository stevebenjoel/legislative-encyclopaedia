import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { serverEnv } from "@/config/env";
import { ApiAccessError, requireApiActor } from "@/lib/auth/api-actor";
import { can } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/db";
import { createMeetingSchema } from "@/lib/validation/committees";

export async function POST(request: NextRequest, context: RouteContext<"/api/committees/[id]/meetings">) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    if (!can(actor.role, "workflow:manage")) return NextResponse.json({ error: "FORBIDDEN", message: "This role cannot schedule internal meetings." }, { status: 403 });
    const { id } = await context.params;
    const input = createMeetingSchema.parse(await request.json());
    const db = getDatabase();
    const committee = await db.committee.findFirst({ where: { id, institutionId: actor.institutionId, isActive: true }, select: { id: true, name: true } });
    if (!committee) return NextResponse.json({ error: "COMMITTEE_NOT_FOUND" }, { status: 404 });
    const participantIds = [...new Set(input.participantIds)];
    const participants = participantIds.length ? await db.user.findMany({ where: { id: { in: participantIds }, status: "ACTIVE", roles: { some: { institutionId: actor.institutionId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } } }, select: { id: true } }) : [];
    if (participants.length !== participantIds.length) return NextResponse.json({ error: "INVALID_PARTICIPANT", message: "Every participant must have an active role in this institution." }, { status: 422 });
    const meeting = await db.$transaction(async (tx) => {
      const created = await tx.meeting.create({ data: { institutionId: actor.institutionId, committeeId: committee.id, title: input.title, startsAt: new Date(input.startsAt), venue: input.venue, virtualLink: input.virtualLink, agenda: input.agenda, accessLevel: input.accessLevel, isOfficialSitting: false, participants: { create: participants.map((participant) => ({ userId: participant.id })) } }, select: { id: true, title: true, startsAt: true } });
      if (participants.length) await tx.notification.createMany({ data: participants.map((participant) => ({ userId: participant.id, type: "COMMITTEE_MEETING", title: "Internal committee meeting scheduled", message: `${committee.name}: ${input.title} is scheduled for ${new Date(input.startsAt).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}.` })) });
      await tx.auditEvent.create({ data: { institutionId: actor.institutionId, actorId: actor.userId, eventType: "COMMITTEE_MEETING_CREATED", entityType: "Meeting", entityId: created.id, metadata: { committeeId: committee.id, startsAt: input.startsAt, accessLevel: input.accessLevel, participantIds, isOfficialSitting: false } } });
      return created;
    });
    return NextResponse.json({ data: meeting, message: "Internal committee meeting scheduled. It is not an official parliamentary sitting." }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "VALIDATION_ERROR", issues: error.issues }, { status: 422 });
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}


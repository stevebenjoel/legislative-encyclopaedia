import "server-only";

import { randomUUID } from "node:crypto";
import type { ApiActor } from "@/lib/auth/api-actor";
import { can, canAccessInstitution } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/db";
import { evaluateTransition, type LegislativeEvent, type VerificationStatus } from "@/lib/legislative/workflow";
import type { LegislativeEventInput } from "@/lib/validation/bills";
import { LegislativeWriteError } from "@/lib/legislative/bill-service";

const resultingStatus: Partial<Record<LegislativeEvent, "IN_PROGRESS" | "PASSED_ORIGINATING_CHAMBER" | "AWAITING_CONCURRENCE" | "HARMONISATION" | "PRESENTED_FOR_ASSENT" | "ASSENTED" | "ASSENT_WITHHELD" | "ENACTMENT_VERIFIED" | "NEGATIVED" | "WITHDRAWN" | "LAPSED">> = {
  FIRST_READING: "IN_PROGRESS",
  SECOND_READING_NEGATIVED: "NEGATIVED",
  THIRD_READING_PASSED: "PASSED_ORIGINATING_CHAMBER",
  THIRD_READING_NEGATIVED: "NEGATIVED",
  TRANSMITTED_TO_OTHER_CHAMBER: "AWAITING_CONCURRENCE",
  CONFERENCE_REQUESTED: "HARMONISATION",
  PRESENTED_FOR_ASSENT: "PRESENTED_FOR_ASSENT",
  ASSENT_GRANTED: "ASSENTED",
  ASSENT_WITHHELD: "ASSENT_WITHHELD",
  ENACTMENT_VERIFIED: "ENACTMENT_VERIFIED",
  WITHDRAWN: "WITHDRAWN",
  LAPSED: "LAPSED",
};

export async function recordLegislativeEvent(billId: string, input: LegislativeEventInput, actor: ApiActor) {
  if (!can(actor.role, "bill:event:record")) {
    throw new LegislativeWriteError(403, "FORBIDDEN", "This role cannot record legislative events.");
  }
  return getDatabase().$transaction(async (tx) => {
    const bill = await tx.bill.findUnique({
      where: { id: billId },
      select: {
        id: true,
        chamberId: true,
        session: { select: { institutionId: true } },
        events: { orderBy: [{ eventDate: "desc" }, { recordedAt: "desc" }], take: 1, select: { eventType: true } },
      },
    });
    if (!bill) throw new LegislativeWriteError(404, "BILL_NOT_FOUND", "Bill not found.");
    if (!canAccessInstitution(actor.role, actor.institutionId, bill.session.institutionId)) {
      throw new LegislativeWriteError(403, "INSTITUTION_MISMATCH", "The bill belongs to another institution.");
    }
    const previous = bill.events[0]?.eventType;
    if (!previous) throw new LegislativeWriteError(409, "MISSING_REGISTRATION_EVENT", "The bill has no registration event.");

    const source = await tx.sourceDocument.findUnique({
      where: { id: input.sourceDocumentId },
      select: { id: true, institutionId: true, verification: true },
    });
    if (!source) throw new LegislativeWriteError(404, "SOURCE_NOT_FOUND", "Supporting source document not found.");
    if (source.institutionId && !canAccessInstitution(actor.role, actor.institutionId, source.institutionId)) {
      throw new LegislativeWriteError(403, "SOURCE_ACCESS_DENIED", "The source belongs to another institution.");
    }

    const standingOrder = input.standingOrderId
      ? await tx.standingOrderEdition.findUnique({ where: { id: input.standingOrderId }, select: { id: true, chamberId: true, verification: true } })
      : null;
    if (standingOrder && standingOrder.chamberId !== bill.chamberId) {
      throw new LegislativeWriteError(409, "RULE_CHAMBER_MISMATCH", "The procedural rule belongs to another chamber.");
    }
    const decision = evaluateTransition(
      previous as LegislativeEvent,
      input.eventType,
      (standingOrder?.verification ?? "UNVERIFIED") as VerificationStatus,
      true,
    );
    if (!decision.allowed) throw new LegislativeWriteError(409, "TRANSITION_BLOCKED", decision.reason ?? "Transition blocked.");

    const auditReference = randomUUID();
    const event = await tx.legislativeEvent.create({
      data: {
        billId,
        chamberId: bill.chamberId,
        recorderId: actor.userId,
        eventType: input.eventType,
        eventDate: new Date(input.eventDate),
        notes: input.notes,
        standingOrderId: standingOrder?.id,
        verification: source.verification === "VERIFIED" ? "PROVISIONAL" : "UNVERIFIED",
        auditReference,
        evidence: { create: { sourceDocumentId: source.id, description: "Legislative event evidence" } },
      },
      select: { id: true, eventType: true, eventDate: true, verification: true, auditReference: true },
    });
    const nextStatus = resultingStatus[input.eventType];
    if (nextStatus) await tx.bill.update({ where: { id: billId }, data: { status: nextStatus } });
    await tx.auditEvent.create({
      data: {
        institutionId: bill.session.institutionId,
        actorId: actor.userId,
        eventType: "LEGISLATIVE_EVENT_RECORDED",
        entityType: "LegislativeEvent",
        entityId: event.id,
        metadata: { auditReference, billId, previousEvent: previous, eventType: input.eventType, sourceDocumentId: source.id },
      },
    });
    return event;
  });
}

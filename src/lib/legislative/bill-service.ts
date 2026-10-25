import "server-only";

import { randomUUID } from "node:crypto";
import type { BillInput } from "@/lib/validation/bills";
import type { ApiActor } from "@/lib/auth/api-actor";
import { can, canAccessInstitution } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/db";

export class LegislativeWriteError extends Error {
  constructor(public status: 400 | 403 | 404 | 409, public code: string, message: string) {
    super(message);
  }
}

export async function registerBill(input: BillInput, actor: ApiActor) {
  if (!can(actor.role, "bill:create")) {
    throw new LegislativeWriteError(403, "FORBIDDEN", "This role cannot register bills.");
  }

  const db = getDatabase();
  return db.$transaction(async (tx) => {
    const session = await tx.assemblySession.findUnique({
      where: { id: input.sessionId },
      select: { id: true, institutionId: true },
    });
    if (!session) throw new LegislativeWriteError(404, "SESSION_NOT_FOUND", "Assembly session not found.");
    if (!canAccessInstitution(actor.role, actor.institutionId, session.institutionId)) {
      throw new LegislativeWriteError(403, "INSTITUTION_MISMATCH", "The session belongs to another institution.");
    }

    const chamber = await tx.chamber.findFirst({
      where: { institutionId: session.institutionId, code: input.chamber },
      select: { id: true },
    });
    if (!chamber) throw new LegislativeWriteError(404, "CHAMBER_NOT_FOUND", "Chamber not found for this institution.");

    const source = await tx.sourceDocument.findUnique({
      where: { id: input.sourceDocumentId },
      select: { id: true, institutionId: true, verification: true },
    });
    if (!source) throw new LegislativeWriteError(404, "SOURCE_NOT_FOUND", "Supporting source document not found.");
    if (source.institutionId && !canAccessInstitution(actor.role, actor.institutionId, source.institutionId)) {
      throw new LegislativeWriteError(403, "SOURCE_ACCESS_DENIED", "The source belongs to another institution.");
    }

    const duplicate = await tx.bill.findUnique({
      where: { chamberId_sessionId_billNumber: { chamberId: chamber.id, sessionId: session.id, billNumber: input.billNumber } },
      select: { id: true },
    });
    if (duplicate) throw new LegislativeWriteError(409, "BILL_NUMBER_EXISTS", "This bill number is already registered for the session.");

    const auditReference = randomUUID();
    const bill = await tx.bill.create({
      data: {
        chamberId: chamber.id,
        sessionId: session.id,
        billNumber: input.billNumber,
        title: input.title,
        classification: input.classification,
        explanatoryMemorandum: input.explanatoryMemorandum,
        status: "REGISTERED",
        verification: "UNVERIFIED",
        versions: { create: { versionNumber: 1, label: "Registration source", sourceDocumentId: source.id } },
        events: {
          create: {
            chamberId: chamber.id,
            recorderId: actor.userId,
            eventType: "REGISTERED",
            eventDate: new Date(),
            verification: source.verification === "VERIFIED" ? "PROVISIONAL" : "UNVERIFIED",
            auditReference,
            evidence: { create: { sourceDocumentId: source.id, description: "Registration evidence" } },
          },
        },
      },
      select: { id: true, billNumber: true, title: true, status: true, verification: true, createdAt: true },
    });

    await tx.auditEvent.create({
      data: {
        institutionId: session.institutionId,
        actorId: actor.userId,
        eventType: "BILL_REGISTERED",
        entityType: "Bill",
        entityId: bill.id,
        metadata: { auditReference, sourceDocumentId: source.id, classification: input.classification },
      },
    });
    return bill;
  });
}

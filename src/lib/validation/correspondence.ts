import { z } from "zod";

export const createCorrespondenceSchema = z.object({
  referenceNumber: z.string().trim().min(3).max(120),
  direction: z.enum(["INCOMING", "OUTGOING"]),
  subject: z.string().trim().min(5).max(500),
  senderOrRecipient: z.string().trim().min(2).max(500),
  summary: z.string().trim().max(10_000).optional(),
  classification: z.enum(["INSTITUTIONAL", "RESTRICTED", "CONFIDENTIAL"]),
  receivedOrSentAt: z.iso.datetime(),
  responseDueAt: z.iso.datetime().optional(),
  assignedToId: z.string().min(1).optional(),
});

export const correspondenceActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ASSIGN"), assignedToId: z.string().min(1) }),
  z.object({ action: z.literal("SAVE_RESPONSE"), responseDraft: z.string().trim().min(5).max(25_000) }),
  z.object({ action: z.literal("MARK_RESPONDED") }),
  z.object({ action: z.literal("ARCHIVE") }),
  z.object({ action: z.literal("REOPEN") }),
]);


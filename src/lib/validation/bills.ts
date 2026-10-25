import { z } from "zod";

export const billSchema = z.object({
  billNumber: z.string().trim().min(2).max(80),
  title: z.string().trim().min(10).max(500),
  chamber: z.enum(["SENATE", "HOUSE"]),
  classification: z.enum(["ORDINARY", "SECTION_59_MONEY", "SECTION_9_CONSTITUTION_ALTERATION", "SECTION_8_STATE_CREATION_OR_BOUNDARY"]),
  sessionId: z.string().min(1),
  explanatoryMemorandum: z.string().max(20_000).optional(),
  sourceDocumentId: z.string().min(1),
});

export type BillInput = z.infer<typeof billSchema>;

export const legislativeEventSchema = z.object({
  eventType: z.enum([
    "NOTICE_PUBLISHED", "FIRST_READING", "SECOND_READING_PASSED", "SECOND_READING_NEGATIVED",
    "COMMITTEE_REFERRED", "HEARING_SCHEDULED", "HEARING_HELD", "COMMITTEE_REPORT_SUBMITTED",
    "COMMITTEE_OF_WHOLE_CONSIDERED", "REPORT_ADOPTED", "THIRD_READING_PASSED", "THIRD_READING_NEGATIVED",
    "TRANSMITTED_TO_OTHER_CHAMBER", "CONCURRENCE_RECORDED", "CONFERENCE_REQUESTED",
    "CONFERENCE_REPORT_ADOPTED", "ENGROSSED", "PRESENTED_FOR_ASSENT", "ASSENT_GRANTED",
    "ASSENT_WITHHELD", "VETO_OVERRIDE_PASSED", "ENACTMENT_VERIFIED", "WITHDRAWN", "LAPSED", "RECOMMITTED",
  ]),
  eventDate: z.iso.datetime(),
  sourceDocumentId: z.string().min(1),
  standingOrderId: z.string().min(1).optional(),
  notes: z.string().trim().max(10_000).optional(),
});

export type LegislativeEventInput = z.infer<typeof legislativeEventSchema>;

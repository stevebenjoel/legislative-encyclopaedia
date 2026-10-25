import { z } from "zod";

export const documentMetadataSchema = z.object({
  documentId: z.string().trim().min(3).max(120).regex(/^[A-Za-z0-9._/-]+$/),
  title: z.string().trim().min(5).max(500),
  type: z.enum(["CONSTITUTION","CONSTITUTIONAL_ALTERATION","ACT","BILL","STANDING_ORDER","COMMITTEE_REPORT","HANSARD","ORDER_PAPER","VOTES_AND_PROCEEDINGS","JUDICIAL_DECISION","POLICY_DOCUMENT","RESEARCH_PUBLICATION","EVIDENCE","OTHER"]),
  accessLevel: z.enum(["PUBLIC","REGISTERED","INSTITUTIONAL","RESTRICTED","CONFIDENTIAL"]),
  publisher: z.string().trim().max(300).optional(),
  sourceUrl: z.url().optional(),
});

export const verificationReviewSchema = z.object({
  status: z.enum(["VERIFIED","PROVISIONAL","DISPUTED","SUPERSEDED"]),
  note: z.string().trim().min(5).max(5_000),
});

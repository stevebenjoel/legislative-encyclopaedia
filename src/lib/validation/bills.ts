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

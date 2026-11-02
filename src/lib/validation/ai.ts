import { z } from "zod";

export const aiChatSchema = z.object({
  task: z.enum(["research", "motion", "debate", "constitution", "scrutiny", "comparison"]).default("research"),
  prompt: z.string().trim().min(10).max(20_000),
  conversationId: z.string().min(1).optional(),
});


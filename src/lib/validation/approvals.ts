import{z}from"zod";
export const createApprovalSchema=z.object({sourceDocumentId:z.string().min(1),reviewerIds:z.array(z.string().min(1)).min(1).max(10)});
export const approvalActionSchema=z.discriminatedUnion("action",[
  z.object({action:z.literal("START_REVIEW"),comment:z.string().trim().max(5_000).optional()}),
  z.object({action:z.literal("REQUEST_CORRECTIONS"),comment:z.string().trim().min(5).max(5_000)}),
  z.object({action:z.literal("RESUBMIT"),comment:z.string().trim().min(5).max(5_000)}),
  z.object({action:z.literal("APPROVE_STEP"),comment:z.string().trim().min(5).max(5_000)}),
  z.object({action:z.literal("ARCHIVE"),comment:z.string().trim().min(5).max(5_000)}),
]);

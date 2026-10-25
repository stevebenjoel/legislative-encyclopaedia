import { z } from "zod";
import { taskStatuses } from "../workflow/transitions";

export const createTaskSchema=z.object({title:z.string().trim().min(5).max(300),description:z.string().trim().max(10_000).optional(),priority:z.enum(["LOW","NORMAL","HIGH","URGENT"]),dueAt:z.iso.datetime().optional(),assigneeIds:z.array(z.string().min(1)).min(1).max(20)});
export const transitionTaskSchema=z.object({status:z.enum(taskStatuses),completionEvidence:z.string().trim().max(5_000).optional()});
export const taskCommentSchema=z.object({body:z.string().trim().min(2).max(5_000)});

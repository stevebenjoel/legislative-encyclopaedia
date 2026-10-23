export const taskStatuses = ["NOT_STARTED", "IN_PROGRESS", "AWAITING_REVIEW", "RETURNED_FOR_CORRECTION", "COMPLETED", "CANCELLED"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

const allowed: Record<TaskStatus, readonly TaskStatus[]> = {
  NOT_STARTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["AWAITING_REVIEW", "CANCELLED"],
  AWAITING_REVIEW: ["RETURNED_FOR_CORRECTION", "COMPLETED"],
  RETURNED_FOR_CORRECTION: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionTask(from: TaskStatus, to: TaskStatus) {
  return allowed[from].includes(to);
}

export function assertTaskTransition(from: TaskStatus, to: TaskStatus, completionEvidence?: string) {
  if (!canTransitionTask(from, to)) throw new Error(`Task cannot move from ${from} to ${to}.`);
  if (to === "COMPLETED" && !completionEvidence?.trim()) throw new Error("Completion evidence is required.");
  return { from, to, completionEvidence: completionEvidence?.trim() };
}

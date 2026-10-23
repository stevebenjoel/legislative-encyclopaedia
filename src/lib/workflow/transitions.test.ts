import { describe, expect, it } from "vitest";
import { assertTaskTransition, canTransitionTask } from "./transitions";

describe("workflow task transitions", () => {
  it("supports the review and correction cycle", () => {
    expect(canTransitionTask("IN_PROGRESS", "AWAITING_REVIEW")).toBe(true);
    expect(canTransitionTask("AWAITING_REVIEW", "RETURNED_FOR_CORRECTION")).toBe(true);
    expect(canTransitionTask("RETURNED_FOR_CORRECTION", "IN_PROGRESS")).toBe(true);
  });

  it("does not skip directly from not started to completed", () => {
    expect(() => assertTaskTransition("NOT_STARTED", "COMPLETED", "Uploaded file")).toThrow();
  });

  it("requires evidence before a reviewed task is completed", () => {
    expect(() => assertTaskTransition("AWAITING_REVIEW", "COMPLETED")).toThrow("Completion evidence");
    expect(assertTaskTransition("AWAITING_REVIEW", "COMPLETED", "  Report version 3  ").completionEvidence).toBe("Report version 3");
  });
});

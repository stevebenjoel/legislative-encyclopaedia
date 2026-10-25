import { describe, expect, it } from "vitest";
import { correspondenceActionSchema, createCorrespondenceSchema } from "./correspondence";

describe("correspondence validation", () => {
  it("requires an identifiable counterparty", () => {
    expect(createCorrespondenceSchema.safeParse({ referenceNumber: "REF-1", direction: "INCOMING", subject: "Request for evidence", senderOrRecipient: "", classification: "INSTITUTIONAL", receivedOrSentAt: new Date().toISOString() }).success).toBe(false);
  });

  it("rejects an empty response draft", () => {
    expect(correspondenceActionSchema.safeParse({ action: "SAVE_RESPONSE", responseDraft: "no" }).success).toBe(false);
  });

  it("accepts archival as an explicit action", () => {
    expect(correspondenceActionSchema.safeParse({ action: "ARCHIVE" }).success).toBe(true);
  });
});


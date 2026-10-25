import { describe, expect, it } from "vitest";
import { billSchema, legislativeEventSchema } from "./bills";

describe("legislative write validation", () => {
  it("accepts a complete provisional bill intake", () => {
    expect(billSchema.parse({
      billNumber: "SB DEMO 100",
      title: "Emergency Medical Response Standards Bill, 2026",
      chamber: "SENATE",
      classification: "ORDINARY",
      sessionId: "session_demo_2026",
      sourceDocumentId: "source_demo_intake",
    }).chamber).toBe("SENATE");
  });

  it("requires an identifiable source for legislative events", () => {
    expect(() => legislativeEventSchema.parse({ eventType: "FIRST_READING", eventDate: new Date().toISOString() })).toThrow();
  });

  it("rejects non-ISO event dates", () => {
    expect(() => legislativeEventSchema.parse({ eventType: "FIRST_READING", eventDate: "25 October 2026", sourceDocumentId: "source" })).toThrow();
  });
});

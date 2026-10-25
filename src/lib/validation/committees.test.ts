import { describe, expect, it } from "vitest";
import { createCommitteeSchema, createMeetingSchema } from "./committees";

describe("committee validation", () => {
  it("requires a substantive committee mandate", () => {
    expect(createCommitteeSchema.safeParse({ name: "Finance", mandate: "short" }).success).toBe(false);
  });

  it("requires at least one meeting agenda item", () => {
    expect(createMeetingSchema.safeParse({ title: "Committee briefing", startsAt: new Date().toISOString(), agenda: [] }).success).toBe(false);
  });

  it("accepts an internal meeting with ordered agenda items", () => {
    expect(createMeetingSchema.safeParse({ title: "Committee briefing", startsAt: new Date().toISOString(), agenda: ["Review referral evidence"], participantIds: [], accessLevel: "RESTRICTED" }).success).toBe(true);
  });
});


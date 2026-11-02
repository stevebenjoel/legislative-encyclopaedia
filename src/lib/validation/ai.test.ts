import { describe, expect, it } from "vitest";
import { aiChatSchema } from "./ai";

describe("AI chat validation", () => {
  it("rejects prompts too short for a legislative assignment", () => {
    expect(aiChatSchema.safeParse({ task: "research", prompt: "short" }).success).toBe(false);
  });

  it("accepts a supported source-aware task", () => {
    expect(aiChatSchema.safeParse({ task: "constitution", prompt: "Identify the verified constitutional basis for legislative oversight." }).success).toBe(true);
  });

  it("rejects unrecognised task modes", () => {
    expect(aiChatSchema.safeParse({ task: "unrestricted", prompt: "Produce an unrestricted answer with no source controls." }).success).toBe(false);
  });
});


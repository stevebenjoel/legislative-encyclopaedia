import { z } from "zod";

export const createCommitteeSchema = z.object({
  name: z.string().trim().min(5).max(240),
  mandate: z.string().trim().min(10).max(10_000),
  chamberId: z.string().min(1).optional(),
});

export const createMeetingSchema = z.object({
  title: z.string().trim().min(5).max(300),
  startsAt: z.iso.datetime(),
  venue: z.string().trim().max(500).optional(),
  virtualLink: z.url().max(2_000).optional(),
  agenda: z.array(z.string().trim().min(2).max(1_000)).min(1).max(50),
  participantIds: z.array(z.string().min(1)).max(100).default([]),
  accessLevel: z.enum(["INSTITUTIONAL", "RESTRICTED", "CONFIDENTIAL"]).default("INSTITUTIONAL"),
});


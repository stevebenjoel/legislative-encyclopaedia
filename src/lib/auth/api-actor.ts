import "server-only";

import type { NextRequest } from "next/server";
import { createJwtAppwrite } from "@/lib/appwrite/server";
import { getDatabase } from "@/lib/db";
import type { PlatformRole } from "@/lib/auth/permissions";

export type ApiActor = {
  userId: string;
  appwriteUserId: string;
  institutionId: string;
  role: PlatformRole;
};

export class ApiAccessError extends Error {
  constructor(public status: 401 | 403, public code: string, message: string) {
    super(message);
  }
}

export async function requireAppwriteAccount(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiAccessError(401, "AUTHENTICATION_REQUIRED", "An Appwrite JWT is required.");
  }
  try {
    const { account } = createJwtAppwrite(authorization.slice(7));
    return await account.get();
  } catch {
    throw new ApiAccessError(401, "INVALID_SESSION", "The Appwrite session is invalid or expired.");
  }
}

export async function requireAppwriteIdentity(request: NextRequest) {
  return (await requireAppwriteAccount(request)).$id;
}

export async function requireApiActor(request: NextRequest): Promise<ApiActor> {
  const institutionId = request.headers.get("x-legiscore-institution-id")?.trim();
  if (!institutionId) {
    throw new ApiAccessError(403, "INSTITUTION_REQUIRED", "Select an institutional workspace.");
  }
  const appwriteUserId = await requireAppwriteIdentity(request);

  const assignment = await getDatabase().roleAssignment.findFirst({
    where: {
      institutionId,
      user: { appwriteUserId, status: "ACTIVE" },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { userId: true, institutionId: true, role: true },
  });
  if (!assignment) {
    throw new ApiAccessError(403, "ROLE_NOT_ASSIGNED", "No active role exists for this institution.");
  }

  return { ...assignment, appwriteUserId, role: assignment.role as PlatformRole };
}

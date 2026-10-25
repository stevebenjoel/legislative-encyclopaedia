import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/config/env";
import { ApiAccessError, requireAppwriteAccount } from "@/lib/auth/api-actor";
import { getDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED", message: "PostgreSQL is not connected." }, { status: 503 });
  try {
    const profile = await requireAppwriteAccount(request);
    const db = getDatabase();
    const existing = await db.user.findFirst({ where: { OR: [{ appwriteUserId: profile.$id }, { email: profile.email }] }, select: { id: true, appwriteUserId: true } });
    if (existing && existing.appwriteUserId !== profile.$id) {
      return NextResponse.json({ error: "ACCOUNT_LINK_CONFLICT", message: "This email is already linked to another identity. Contact an administrator." }, { status: 409 });
    }
    const user = await db.user.upsert({
      where: { appwriteUserId: profile.$id },
      update: { email: profile.email, displayName: profile.name || profile.email, emailVerified: profile.emailVerification, status: "ACTIVE" },
      create: { appwriteUserId: profile.$id, email: profile.email, displayName: profile.name || profile.email, emailVerified: profile.emailVerification, status: "ACTIVE" },
      select: { id: true, displayName: true, email: true, emailVerified: true, status: true },
    });
    return NextResponse.json({ data: user, message: "Identity synchronized. Institutional roles are assigned separately." });
  } catch (error) {
    if (error instanceof ApiAccessError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}

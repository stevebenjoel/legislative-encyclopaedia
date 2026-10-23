import { NextResponse } from "next/server";
import { isAppwriteConfigured, serverEnv } from "@/config/env";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "legislative-encyclopaedia",
      appwriteConfigured: isAppwriteConfigured,
      databaseConfigured: Boolean(serverEnv.databaseUrl),
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

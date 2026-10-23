import { NextResponse } from "next/server";
import { isAppwriteConfigured } from "@/config/env";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "legislative-encyclopaedia",
      appwriteConfigured: isAppwriteConfigured,
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

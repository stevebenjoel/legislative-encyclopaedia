import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiAccessError, requireApiActor } from "@/lib/auth/api-actor";
import { LegislativeWriteError } from "@/lib/legislative/bill-service";
import { recordLegislativeEvent } from "@/lib/legislative/event-service";
import { legislativeEventSchema } from "@/lib/validation/bills";
import { serverEnv } from "@/config/env";

export async function POST(request: NextRequest, context: RouteContext<"/api/bills/[id]/events">) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    const { id } = await context.params;
    const input = legislativeEventSchema.parse(await request.json());
    const event = await recordLegislativeEvent(id, input, actor);
    return NextResponse.json({ data: event, message: "Event recorded as pending verification." }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "VALIDATION_ERROR", issues: error.issues }, { status: 422 });
    if (error instanceof ApiAccessError || error instanceof LegislativeWriteError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { serverEnv } from "@/config/env";
import { ApiAccessError, requireApiActor } from "@/lib/auth/api-actor";
import { can, canAccessInstitution } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/db";
import { verificationReviewSchema } from "@/lib/validation/documents";

export async function PATCH(request:NextRequest,context:RouteContext<"/api/documents/[id]/verification">){
  if(!serverEnv.databaseUrl)return NextResponse.json({error:"DATABASE_NOT_CONFIGURED"},{status:503});
  try{const actor=await requireApiActor(request);if(!can(actor.role,"document:manage"))return NextResponse.json({error:"FORBIDDEN"},{status:403});const {id}=await context.params;const input=verificationReviewSchema.parse(await request.json());const db=getDatabase();const existing=await db.sourceDocument.findUnique({where:{id},select:{id:true,institutionId:true,verification:true}});if(!existing)return NextResponse.json({error:"DOCUMENT_NOT_FOUND"},{status:404});if(!existing.institutionId||!canAccessInstitution(actor.role,actor.institutionId,existing.institutionId))return NextResponse.json({error:"INSTITUTION_MISMATCH"},{status:403});const updated=await db.$transaction(async(tx)=>{const document=await tx.sourceDocument.update({where:{id},data:{verification:input.status},select:{id:true,verification:true,updatedAt:true}});await tx.auditEvent.create({data:{institutionId:actor.institutionId,actorId:actor.userId,eventType:"SOURCE_VERIFICATION_CHANGED",entityType:"SourceDocument",entityId:id,metadata:{previousStatus:existing.verification,status:input.status,note:input.note}}});return document});return NextResponse.json({data:updated,message:"Verification decision recorded in the audit trail."})}catch(error){if(error instanceof ZodError)return NextResponse.json({error:"VALIDATION_ERROR",issues:error.issues},{status:422});if(error instanceof ApiAccessError)return NextResponse.json({error:error.code,message:error.message},{status:error.status});throw error}
}

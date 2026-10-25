import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { billSchema } from "@/lib/validation/bills";
import { demoBills } from "@/lib/demo-data";
import { serverEnv } from "@/config/env";
import { requireApiActor, ApiAccessError } from "@/lib/auth/api-actor";
import { registerBill, LegislativeWriteError } from "@/lib/legislative/bill-service";
import { getDatabase } from "@/lib/db";

export async function GET(){
  if(!serverEnv.databaseUrl)return NextResponse.json({data:demoBills,meta:{mode:"demonstration",official:false}});
  const bills=await getDatabase().bill.findMany({orderBy:{updatedAt:"desc"},take:100,select:{id:true,billNumber:true,title:true,status:true,verification:true,updatedAt:true,chamber:{select:{name:true,code:true}}}});
  return NextResponse.json({data:bills,meta:{mode:"database",official:false}});
}

export async function POST(request:NextRequest){
  if(!serverEnv.databaseUrl)return NextResponse.json({error:"DATABASE_NOT_CONFIGURED",message:"Connect PostgreSQL before creating legislative records."},{status:503});
  try{const actor=await requireApiActor(request);const input=billSchema.parse(await request.json());const bill=await registerBill(input,actor);return NextResponse.json({data:bill,message:"Provisional research record registered. This is not formal legislative introduction."},{status:201});}
  catch(error){if(error instanceof ZodError)return NextResponse.json({error:"VALIDATION_ERROR",issues:error.issues},{status:422});if(error instanceof ApiAccessError||error instanceof LegislativeWriteError)return NextResponse.json({error:error.code,message:error.message},{status:error.status});throw error}
}

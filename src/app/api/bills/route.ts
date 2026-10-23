import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { billSchema } from "@/lib/validation/bills";
import { demoBills } from "@/lib/demo-data";
import { serverEnv } from "@/config/env";

export function GET(){return NextResponse.json({data:demoBills,meta:{mode:"demonstration",official:false}})}

export async function POST(request:NextRequest){
  if(!serverEnv.databaseUrl)return NextResponse.json({error:"DATABASE_NOT_CONFIGURED",message:"Connect PostgreSQL before creating legislative records."},{status:503});
  try{const input=billSchema.parse(await request.json());return NextResponse.json({data:input,message:"Validation passed. Persistence requires an authenticated institutional role."},{status:202});}
  catch(error){if(error instanceof ZodError)return NextResponse.json({error:"VALIDATION_ERROR",issues:error.issues},{status:422});throw error}
}

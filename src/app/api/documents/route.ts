import { createHash } from "node:crypto";
import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { serverEnv } from "@/config/env";
import { ApiAccessError, requireApiActor } from "@/lib/auth/api-actor";
import { can } from "@/lib/auth/permissions";
import { createAdminAppwrite } from "@/lib/appwrite/server";
import { getDatabase } from "@/lib/db";
import { documentMetadataSchema } from "@/lib/validation/documents";

const allowedMimeTypes = new Set(["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain","text/markdown"]);
const maximumBytes = 20 * 1024 * 1024;

export async function GET(request: NextRequest) {
  if (!serverEnv.databaseUrl) return NextResponse.json({ error: "DATABASE_NOT_CONFIGURED", message: "PostgreSQL is not connected." }, { status: 503 });
  try {
    const actor = await requireApiActor(request);
    if (!can(actor.role,"document:read")) return NextResponse.json({error:"FORBIDDEN"},{status:403});
    const documents = await getDatabase().sourceDocument.findMany({
      where: { OR: [{ institutionId: actor.institutionId }, { institutionId: null, accessLevel: "PUBLIC" }] },
      orderBy: { updatedAt: "desc" }, take: 100,
      select: { id:true,documentId:true,title:true,type:true,publisher:true,verification:true,accessLevel:true,currentVersion:true,updatedAt:true,versions:{orderBy:{versionNumber:"desc"},take:1,select:{mimeType:true,fileSize:true,integrityHash:true}} },
    });
    return NextResponse.json({data:documents.map((document)=>({...document,versions:document.versions.map((version)=>({...version,fileSize:version.fileSize?.toString()}))}))});
  } catch(error) { if(error instanceof ApiAccessError)return NextResponse.json({error:error.code,message:error.message},{status:error.status});throw error; }
}

export async function POST(request: NextRequest) {
  if (!serverEnv.databaseUrl || !serverEnv.storageBucketId || !serverEnv.appwriteApiKey) return NextResponse.json({error:"DOCUMENT_STORAGE_NOT_CONFIGURED",message:"PostgreSQL and Appwrite server storage must be configured."},{status:503});
  let uploadedFileId: string | undefined;
  try {
    const actor=await requireApiActor(request);
    if(!can(actor.role,"document:manage"))return NextResponse.json({error:"FORBIDDEN",message:"This role cannot manage source documents."},{status:403});
    const form=await request.formData();
    const file=form.get("file");
    if(!(file instanceof File))return NextResponse.json({error:"FILE_REQUIRED",message:"Choose a document to upload."},{status:422});
    if(file.size===0||file.size>maximumBytes)return NextResponse.json({error:"FILE_SIZE_INVALID",message:"Documents must be between 1 byte and 20 MB."},{status:422});
    if(!allowedMimeTypes.has(file.type))return NextResponse.json({error:"FILE_TYPE_INVALID",message:"Upload a PDF, DOCX, plain text or Markdown document."},{status:422});
    const metadata=documentMetadataSchema.parse({documentId:form.get("documentId"),title:form.get("title"),type:form.get("type"),accessLevel:form.get("accessLevel"),publisher:form.get("publisher")||undefined,sourceUrl:form.get("sourceUrl")||undefined});
    if(await getDatabase().sourceDocument.findUnique({where:{documentId:metadata.documentId},select:{id:true}}))return NextResponse.json({error:"DOCUMENT_ID_EXISTS",message:"This document identifier already exists."},{status:409});
    const bytes=new Uint8Array(await file.arrayBuffer());
    const integrityHash=createHash("sha256").update(bytes).digest("hex");
    uploadedFileId=ID.unique();
    const {storage}=createAdminAppwrite();
    await storage.createFile({bucketId:serverEnv.storageBucketId,fileId:uploadedFileId,file:InputFile.fromBuffer(bytes,file.name),permissions:[]});
    const document=await getDatabase().$transaction(async(tx)=>{
      const created=await tx.sourceDocument.create({data:{institutionId:actor.institutionId,documentId:metadata.documentId,title:metadata.title,type:metadata.type,publisher:metadata.publisher,sourceUrl:metadata.sourceUrl,verification:"UNVERIFIED",accessLevel:metadata.accessLevel,versions:{create:{versionNumber:1,storageFileId:uploadedFileId,mimeType:file.type,fileSize:BigInt(file.size),integrityHash,changeSummary:"Initial institutional intake"}}},select:{id:true,documentId:true,title:true,verification:true,accessLevel:true,currentVersion:true}});
      await tx.auditEvent.create({data:{institutionId:actor.institutionId,actorId:actor.userId,eventType:"SOURCE_DOCUMENT_UPLOADED",entityType:"SourceDocument",entityId:created.id,metadata:{documentId:created.documentId,storageFileId:uploadedFileId,integrityHash,mimeType:file.type,fileSize:file.size}}});
      return created;
    });
    return NextResponse.json({data:document,message:"Document stored as an unverified source pending human review."},{status:201});
  } catch(error) {
    if(uploadedFileId&&serverEnv.storageBucketId){try{await createAdminAppwrite().storage.deleteFile({bucketId:serverEnv.storageBucketId,fileId:uploadedFileId})}catch{}}
    if(error instanceof ZodError)return NextResponse.json({error:"VALIDATION_ERROR",issues:error.issues},{status:422});
    if(error instanceof ApiAccessError)return NextResponse.json({error:error.code,message:error.message},{status:error.status});
    throw error;
  }
}

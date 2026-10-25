import { describe, expect, it } from "vitest";
import { documentMetadataSchema, verificationReviewSchema } from "./documents";

describe("source document validation",()=>{
  it("accepts a controlled institutional source identifier",()=>{expect(documentMetadataSchema.parse({documentId:"NASS/VP/2026-014",title:"Votes and Proceedings for demonstration",type:"VOTES_AND_PROCEEDINGS",accessLevel:"INSTITUTIONAL"}).type).toBe("VOTES_AND_PROCEEDINGS")});
  it("rejects identifiers containing unsafe characters",()=>{expect(()=>documentMetadataSchema.parse({documentId:"../../secret file",title:"Invalid source record",type:"OTHER",accessLevel:"CONFIDENTIAL"})).toThrow()});
  it("requires a meaningful human review note",()=>{expect(()=>verificationReviewSchema.parse({status:"VERIFIED",note:"ok"})).toThrow();expect(verificationReviewSchema.parse({status:"VERIFIED",note:"Matched against the authenticated published record."}).status).toBe("VERIFIED")});
});

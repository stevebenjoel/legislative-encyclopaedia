import Link from "next/link";
import { CorrespondenceWorkspace } from "@/components/workflow/correspondence-workspace";
import { isAppwriteConfigured, serverEnv } from "@/config/env";

export const metadata = { title: "Legislative correspondence" };

export default function CorrespondencePage() {
  return <main><div className="page-header"><div><p className="eyebrow">Smart parliamentary workflow</p><h1>Legislative correspondence</h1><p className="subtitle">Register, assign, draft, track and archive incoming and outgoing institutional correspondence.</p></div><Link className="button secondary" href="/workflow">Back to workflow</Link></div><CorrespondenceWorkspace configured={isAppwriteConfigured && Boolean(serverEnv.databaseUrl)}/></main>;
}


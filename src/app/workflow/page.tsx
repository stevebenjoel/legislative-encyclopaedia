import Link from "next/link";
import { TaskWorkspace } from "@/components/workflow/task-workspace";
import { isAppwriteConfigured, serverEnv } from "@/config/env";
export const metadata={title:"Smart parliamentary workflow"};
export default function WorkflowPage(){return <main><div className="page-header"><div><p className="eyebrow">Internal operations</p><h1>Smart parliamentary workflow</h1><p className="subtitle">Role-aware tasks, reviews and collaboration. Internal actions never become legally effective parliamentary proceedings automatically.</p></div><Link className="button secondary" href="/workflow/approvals">Document approvals</Link></div><TaskWorkspace configured={isAppwriteConfigured&&Boolean(serverEnv.databaseUrl)}/></main>}

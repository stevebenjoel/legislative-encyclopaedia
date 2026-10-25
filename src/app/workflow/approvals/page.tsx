import Link from "next/link";
import { ApprovalWorkspace } from "@/components/workflow/approval-workspace";
import { isAppwriteConfigured, serverEnv } from "@/config/env";

export const metadata = { title: "Document approval workflow" };

export default function ApprovalWorkflowPage() {
  const configured = isAppwriteConfigured && Boolean(serverEnv.databaseUrl);
  const storageConfigured = Boolean(serverEnv.appwriteApiKey && serverEnv.storageBucketId);
  return (
    <main>
      <div className="page-header">
        <div>
          <p className="eyebrow">Internal operations</p>
          <h1>Document approval workflow</h1>
          <p className="subtitle">Review exact document versions in sequence, return corrections, resubmit immutably, and preserve every decision in the audit trail.</p>
        </div>
        <Link className="button secondary" href="/workflow">Back to tasks</Link>
      </div>
      <ApprovalWorkspace configured={configured} storageConfigured={storageConfigured} />
    </main>
  );
}

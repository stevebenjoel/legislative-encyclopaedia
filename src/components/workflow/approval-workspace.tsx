"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrowserAppwrite } from "@/lib/appwrite/client";

type Workspace = { role: string; institution: { id: string; name: string } };
type Member = { id: string; displayName: string; email: string };
type Source = { id: string; documentId: string; title: string; currentVersion: number };
type Step = {
  id: string;
  position: number;
  status: string;
  comments?: string;
  decidedAt?: string;
  reviewer: Member;
};
type Approval = {
  id: string;
  status: string;
  currentStep: number;
  documentVersion: number;
  createdAt: string;
  updatedAt: string;
  sourceDocument: Source & {
    verification: string;
    versions: { id: string; versionNumber: number; integrityHash: string; changeSummary?: string; createdAt: string }[];
  };
  steps: Step[];
};

const permittedRoles = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "LEGISLATIVE_CLERK",
  "COMMITTEE_SECRETARY",
  "LEGISLATIVE_RESEARCHER",
  "DATA_VERIFICATION_OFFICER",
];

export function ApprovalWorkspace({
  configured,
  storageConfigured,
}: {
  configured: boolean;
  storageConfigured: boolean;
}) {
  const [jwt, setJwt] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [actorUserId, setActorUserId] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(!configured);
  const [message, setMessage] = useState(
    configured
      ? "Checking document approval access…"
      : "Connect Appwrite and PostgreSQL to use document approvals.",
  );

  const workspace = useMemo(
    () => workspaces.find((item) => item.institution.id === institutionId),
    [institutionId, workspaces],
  );

  async function load(token: string, institution: string) {
    const response = await fetch("/api/approvals", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-LegisCore-Institution-Id": institution,
      },
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? "Approvals could not be loaded.");
    setApprovals(payload.data);
    setSources(payload.meta.sources);
    setMembers(payload.meta.members);
    setCanManage(payload.meta.canManage);
    setActorUserId(payload.meta.actorUserId);
  }

  useEffect(() => {
    if (!configured) return;
    let active = true;
    void (async () => {
      try {
        const token = await getBrowserAppwrite().account.createJWT({ duration: 900 });
        const response = await fetch("/api/workspaces", {
          headers: { Authorization: `Bearer ${token.jwt}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Workspaces could not be loaded.");
        const allowed = (payload.data as Workspace[]).filter((item) =>
          permittedRoles.includes(item.role),
        );
        if (!active) return;
        setJwt(token.jwt);
        setWorkspaces(allowed);
        const first = allowed[0]?.institution.id ?? "";
        setInstitutionId(first);
        if (first) {
          await load(token.jwt, first);
          setError(false);
          setMessage("Internal approval is operational; it does not enact a parliamentary decision.");
        } else {
          setError(true);
          setMessage("Your account has no document approval role.");
        }
      } catch (caught) {
        if (active) {
          setError(true);
          setMessage(caught instanceof Error ? caught.message : "Approvals could not be loaded.");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [configured]);

  async function changeWorkspace(id: string) {
    setInstitutionId(id);
    if (!jwt || !id) return;
    setBusy(true);
    try {
      await load(jwt, id);
      setError(false);
      setMessage("Institutional approval queue loaded.");
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "Approvals could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  async function createApproval(formData: FormData) {
    if (!jwt || !institutionId) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          "X-LegisCore-Institution-Id": institutionId,
        },
        body: JSON.stringify({
          sourceDocumentId: formData.get("sourceDocumentId"),
          reviewerIds: formData.getAll("reviewerIds"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Approval workflow could not be created.");
      await load(jwt, institutionId);
      setMessage(payload.message);
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "Approval workflow could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function act(approvalId: string, action: string, formData?: FormData) {
    if (!jwt || !institutionId) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(`/api/approvals/${approvalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          "X-LegisCore-Institution-Id": institutionId,
        },
        body: JSON.stringify({ action, comment: formData?.get("comment") || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Approval action failed.");
      await load(jwt, institutionId);
      setMessage(payload.message);
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "Approval action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadVersion(sourceId: string, formData: FormData) {
    if (!jwt || !institutionId) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(`/api/documents/${sourceId}/versions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "X-LegisCore-Institution-Id": institutionId,
        },
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "New document version could not be stored.");
      await load(jwt, institutionId);
      setMessage(`${payload.message} You may now resubmit it to the current reviewer.`);
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "New document version could not be stored.");
    } finally {
      setBusy(false);
    }
  }

  const disabled = !configured || !workspace || !jwt || busy;
  const activeCount = approvals.filter((item) => !["APPROVED", "ARCHIVED"].includes(item.status)).length;
  const correctionCount = approvals.filter((item) => item.status === "CORRECTIONS_REQUESTED").length;
  const approvedCount = approvals.filter((item) => item.status === "APPROVED").length;

  return (
    <>
      <div className="review-banner">
        <div>
          <strong>INTERNAL LEGISCORE APPROVAL — NOT FORMAL PARLIAMENTARY APPROVAL</strong>
          <span>Every decision is bound to an exact immutable file version and recorded in the audit trail.</span>
        </div>
      </div>
      <div className="field workspace-selector">
        <label htmlFor="approval-institution">Institutional workspace</label>
        <select
          id="approval-institution"
          className="input"
          value={institutionId}
          onChange={(event) => void changeWorkspace(event.target.value)}
          disabled={!workspaces.length}
        >
          {workspaces.map((item) => (
            <option key={item.institution.id} value={item.institution.id}>
              {item.institution.name} · {item.role.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className={`form-message ${error ? "error" : ""}`} role="status">{message}</div>
      <section className="metric-grid approval-metrics">
        <article className="metric-card"><div className="metric-label">Active reviews</div><div className="metric-value">{activeCount}</div><div className="metric-change">Sequential human review</div></article>
        <article className="metric-card"><div className="metric-label">Corrections due</div><div className="metric-value">{correctionCount}</div><div className="metric-change">New version required</div></article>
        <article className="metric-card"><div className="metric-label">Internally approved</div><div className="metric-value">{approvedCount}</div><div className="metric-change">Not parliamentary assent</div></article>
      </section>
      {canManage && (
        <section className="panel approval-create">
          <div className="panel-header"><h2>Create sequential review</h2><span className="badge provisional">VERSION LOCKED</span></div>
          <form className="panel-body approval-create-form" action={createApproval}>
            <div className="field">
              <label htmlFor="approval-source">Source document</label>
              <select id="approval-source" name="sourceDocumentId" className="input" disabled={disabled} required>
                <option value="">Select a document</option>
                {sources.map((source) => <option key={source.id} value={source.id}>{source.documentId} · v{source.currentVersion} · {source.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="approval-reviewers">Reviewers in approval order</label>
              <select id="approval-reviewers" name="reviewerIds" className="input multi-select" multiple disabled={disabled} required>
                {members.map((member) => <option key={member.id} value={member.id}>{member.displayName} · {member.email}</option>)}
              </select>
              <span className="table-kicker">Selected reviewers run in the order shown in this list.</span>
            </div>
            <button className="button" disabled={disabled}>{busy ? "Saving…" : "Start approval"}</button>
          </form>
        </section>
      )}
      <section className="approval-list">
        {approvals.map((approval) => {
          const current = approval.steps[approval.currentStep];
          const isCurrentReviewer = current?.reviewer.id === actorUserId;
          const hasNewVersion = approval.sourceDocument.currentVersion > approval.documentVersion;
          return (
            <article className="panel approval-card" key={approval.id}>
              <div className="approval-summary">
                <div>
                  <span className={`badge ${approval.status === "APPROVED" ? "verified" : approval.status === "CORRECTIONS_REQUESTED" ? "disputed" : "provisional"}`}>{approval.status.replaceAll("_", " ")}</span>
                  <h2>{approval.sourceDocument.title}</h2>
                  <p>{approval.sourceDocument.documentId} · approval file v{approval.documentVersion} · current file v{approval.sourceDocument.currentVersion}</p>
                </div>
                <div className="task-facts"><strong>Step {Math.min(approval.currentStep + 1, approval.steps.length)} of {approval.steps.length}</strong><span>Updated {new Date(approval.updatedAt).toLocaleString("en-NG")}</span></div>
              </div>
              <ol className="approval-steps">
                {approval.steps.map((step) => (
                  <li key={step.id} className={step.position === approval.currentStep ? "current" : ""}>
                    <span>{step.position + 1}</span>
                    <div><strong>{step.reviewer.displayName}</strong><small>{step.status.replaceAll("_", " ")}</small>{step.comments && <p>{step.comments}</p>}</div>
                  </li>
                ))}
              </ol>
              <details className="version-history">
                <summary>Immutable version history ({approval.sourceDocument.versions.length})</summary>
                {approval.sourceDocument.versions.map((version) => (
                  <div key={version.id}>
                    <strong>Version {version.versionNumber}</strong>
                    <span>{version.changeSummary || "Initial ingested version"} · {new Date(version.createdAt).toLocaleString("en-NG")}</span>
                    <code>{version.integrityHash}</code>
                  </div>
                ))}
              </details>
              <div className="approval-actions">
                {isCurrentReviewer && ["SUBMITTED_FOR_REVIEW", "RESUBMITTED"].includes(approval.status) && (
                  <form action={act.bind(null, approval.id, "START_REVIEW")}><button className="button" disabled={disabled}>Start review</button></form>
                )}
                {isCurrentReviewer && approval.status === "REVIEW_IN_PROGRESS" && (
                  <>
                    <form action={act.bind(null, approval.id, "REQUEST_CORRECTIONS")}><input name="comment" className="input" minLength={5} placeholder="Required correction note" disabled={disabled} required/><button className="button secondary" disabled={disabled}>Request corrections</button></form>
                    <form action={act.bind(null, approval.id, "APPROVE_STEP")}><input name="comment" className="input" minLength={5} placeholder="Approval basis or evidence" disabled={disabled} required/><button className="button" disabled={disabled}>Approve this step</button></form>
                  </>
                )}
                {canManage && approval.status === "CORRECTIONS_REQUESTED" && (
                  <>
                    <form className="version-form" action={uploadVersion.bind(null, approval.sourceDocument.id)}>
                      <input name="file" className="input file-input" type="file" accept=".pdf,.docx,.txt,.md" disabled={disabled || !storageConfigured} required/>
                      <input name="changeSummary" className="input" minLength={5} placeholder="What changed in this immutable version?" disabled={disabled || !storageConfigured} required/>
                      <button className="button secondary" disabled={disabled || !storageConfigured}>{storageConfigured ? "Upload corrected version" : "Storage not configured"}</button>
                    </form>
                    <form action={act.bind(null, approval.id, "RESUBMIT")}><input name="comment" className="input" minLength={5} placeholder="Resubmission note" disabled={disabled || !hasNewVersion} required/><button className="button" disabled={disabled || !hasNewVersion}>Resubmit v{approval.sourceDocument.currentVersion}</button></form>
                  </>
                )}
                {canManage && approval.status === "APPROVED" && (
                  <form action={act.bind(null, approval.id, "ARCHIVE")}><input name="comment" className="input" minLength={5} placeholder="Archival reason" disabled={disabled} required/><button className="button secondary" disabled={disabled}>Archive workflow</button></form>
                )}
              </div>
            </article>
          );
        })}
        {approvals.length === 0 && <section className="panel empty-state"><h2>No approval workflows yet</h2><p>Create a sequential review for an ingested source document, or select another workspace.</p></section>}
      </section>
    </>
  );
}

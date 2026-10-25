"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, MailPlus, Search } from "lucide-react";
import { getBrowserAppwrite } from "@/lib/appwrite/client";

type Workspace = { role: string; institution: { id: string; name: string } };
type Member = { id: string; displayName: string; email: string };
type RecordItem = {
  id: string;
  referenceNumber: string;
  direction: "INCOMING" | "OUTGOING";
  subject: string;
  senderOrRecipient: string;
  summary?: string;
  classification: string;
  status: string;
  receivedOrSentAt: string;
  responseDueAt?: string;
  responseDraft?: string;
  archivedAt?: string;
  updatedAt: string;
  assignedTo?: Member;
};

const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "LEGISLATOR", "LEGISLATIVE_CLERK", "COMMITTEE_CHAIRPERSON", "COMMITTEE_SECRETARY", "LEGISLATIVE_RESEARCHER", "LEGAL_ADVISER", "POLICY_ANALYST"];

export function CorrespondenceWorkspace({ configured }: { configured: boolean }) {
  const [jwt, setJwt] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [actorUserId, setActorUserId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(!configured);
  const [message, setMessage] = useState(configured ? "Checking correspondence access…" : "Connect Appwrite and PostgreSQL to activate correspondence management.");

  async function load(token: string, institution: string) {
    const response = await fetch("/api/correspondence", { headers: { Authorization: `Bearer ${token}`, "X-LegisCore-Institution-Id": institution } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? "Correspondence could not be loaded.");
    setRecords(payload.data); setMembers(payload.meta.members); setCanManage(payload.meta.canManage); setActorUserId(payload.meta.actorUserId);
  }

  useEffect(() => {
    if (!configured) return;
    let active = true;
    void (async () => {
      try {
        const token = await getBrowserAppwrite().account.createJWT({ duration: 900 });
        const response = await fetch("/api/workspaces", { headers: { Authorization: `Bearer ${token.jwt}` } });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Workspaces could not be loaded.");
        const allowed = (payload.data as Workspace[]).filter((item) => allowedRoles.includes(item.role));
        if (!active) return;
        const remembered = sessionStorage.getItem("legiscoreInstitutionId");
        const first = allowed.some((item) => item.institution.id === remembered) ? remembered! : allowed[0]?.institution.id ?? "";
        setJwt(token.jwt); setWorkspaces(allowed); setInstitutionId(first);
        if (first) { await load(token.jwt, first); setError(false); setMessage("Institutional correspondence register loaded."); }
        else { setError(true); setMessage("Your account has no correspondence workspace access."); }
      } catch (caught) { if (active) { setError(true); setMessage(caught instanceof Error ? caught.message : "Correspondence could not be loaded."); } }
    })();
    return () => { active = false; };
  }, [configured]);

  async function changeWorkspace(id: string) {
    setInstitutionId(id); sessionStorage.setItem("legiscoreInstitutionId", id);
    if (!jwt || !id) return;
    setBusy(true);
    try { await load(jwt, id); setError(false); setMessage("Institutional correspondence register loaded."); }
    catch (caught) { setError(true); setMessage(caught instanceof Error ? caught.message : "Correspondence could not be loaded."); }
    finally { setBusy(false); }
  }

  async function createRecord(formData: FormData) {
    if (!jwt || !institutionId) return;
    setBusy(true); setError(false);
    try {
      const due = String(formData.get("responseDueAt") || "");
      const response = await fetch("/api/correspondence", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, "X-LegisCore-Institution-Id": institutionId }, body: JSON.stringify({ referenceNumber: formData.get("referenceNumber"), direction: formData.get("direction"), subject: formData.get("subject"), senderOrRecipient: formData.get("senderOrRecipient"), summary: formData.get("summary") || undefined, classification: formData.get("classification"), receivedOrSentAt: new Date(String(formData.get("receivedOrSentAt"))).toISOString(), responseDueAt: due ? new Date(due).toISOString() : undefined, assignedToId: formData.get("assignedToId") || undefined }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Correspondence could not be registered.");
      await load(jwt, institutionId); setMessage(payload.message);
    } catch (caught) { setError(true); setMessage(caught instanceof Error ? caught.message : "Correspondence could not be registered."); }
    finally { setBusy(false); }
  }

  async function act(id: string, action: string, formData?: FormData) {
    if (!jwt || !institutionId) return;
    setBusy(true); setError(false);
    try {
      const response = await fetch(`/api/correspondence/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, "X-LegisCore-Institution-Id": institutionId }, body: JSON.stringify({ action, assignedToId: formData?.get("assignedToId") || undefined, responseDraft: formData?.get("responseDraft") || undefined }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Correspondence action failed.");
      await load(jwt, institutionId); setMessage(payload.message);
    } catch (caught) { setError(true); setMessage(caught instanceof Error ? caught.message : "Correspondence action failed."); }
    finally { setBusy(false); }
  }

  const filtered = useMemo(() => records.filter((record) => {
    const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? record.status !== "ARCHIVED" : record.status === statusFilter);
    const text = `${record.referenceNumber} ${record.subject} ${record.senderOrRecipient} ${record.assignedTo?.displayName ?? ""}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  }), [query, records, statusFilter]);
  const overdue = records.filter((record) => record.responseDueAt && new Date(record.responseDueAt) < new Date() && !["RESPONDED", "ARCHIVED"].includes(record.status)).length;
  const disabled = !jwt || !institutionId || busy;

  return <>
    <div className="review-banner"><div><strong>RESTRICTED INSTITUTIONAL REGISTER</strong><span>Access is role- and institution-scoped. Confidential correspondence is never exposed through public search.</span></div></div>
    <div className="field workspace-selector"><label htmlFor="correspondence-institution">Institutional workspace</label><select id="correspondence-institution" className="input" value={institutionId} onChange={(event) => void changeWorkspace(event.target.value)} disabled={!workspaces.length}>{workspaces.map((item) => <option key={item.institution.id} value={item.institution.id}>{item.institution.name} · {item.role.replaceAll("_", " ")}</option>)}</select></div>
    <div className={`form-message ${error ? "error" : ""}`} role="status">{message}</div>
    <section className="metric-grid correspondence-metrics"><article className="metric-card"><div className="metric-label">Visible records</div><div className="metric-value">{records.length}</div><div className="metric-change">Institution scoped</div></article><article className="metric-card"><div className="metric-label">Awaiting response</div><div className="metric-value">{records.filter((record) => !["RESPONDED", "ARCHIVED"].includes(record.status)).length}</div><div className="metric-change">Active workflow</div></article><article className="metric-card"><div className="metric-label">Overdue responses</div><div className="metric-value">{overdue}</div><div className="metric-change">Configured deadlines only</div></article><article className="metric-card"><div className="metric-label">Confidential</div><div className="metric-value">{records.filter((record) => record.classification === "CONFIDENTIAL").length}</div><div className="metric-change">Restricted visibility</div></article></section>
    {canManage && <section className="panel correspondence-create"><div className="panel-header"><h2>Register correspondence</h2><span className="badge provisional">AUDITED</span></div><form className="panel-body correspondence-form" action={createRecord}><div className="field"><label htmlFor="correspondence-reference">Reference number</label><input id="correspondence-reference" name="referenceNumber" className="input" minLength={3} maxLength={120} disabled={disabled} required/></div><div className="field"><label htmlFor="correspondence-direction">Direction</label><select id="correspondence-direction" name="direction" className="input" disabled={disabled}><option>INCOMING</option><option>OUTGOING</option></select></div><div className="field"><label htmlFor="correspondence-party">Sender or recipient</label><input id="correspondence-party" name="senderOrRecipient" className="input" minLength={2} maxLength={500} disabled={disabled} required/></div><div className="field"><label htmlFor="correspondence-date">Received or sent</label><input id="correspondence-date" name="receivedOrSentAt" className="input" type="datetime-local" disabled={disabled} required/></div><div className="field"><label htmlFor="correspondence-due">Response due</label><input id="correspondence-due" name="responseDueAt" className="input" type="datetime-local" disabled={disabled}/></div><div className="field"><label htmlFor="correspondence-classification">Classification</label><select id="correspondence-classification" name="classification" className="input" disabled={disabled}><option>INSTITUTIONAL</option><option>RESTRICTED</option><option>CONFIDENTIAL</option></select></div><div className="field"><label htmlFor="correspondence-assignee">Responsible officer</label><select id="correspondence-assignee" name="assignedToId" className="input" disabled={disabled}><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}</select></div><div className="field wide"><label htmlFor="correspondence-subject">Subject</label><input id="correspondence-subject" name="subject" className="input" minLength={5} maxLength={500} disabled={disabled} required/></div><div className="field wide"><label htmlFor="correspondence-summary">Internal summary</label><textarea id="correspondence-summary" name="summary" className="input" rows={3} maxLength={10000} disabled={disabled}/></div><button className="button" disabled={disabled}><MailPlus size={15}/>{busy ? "Registering…" : "Register correspondence"}</button></form></section>}
    <div className="filterbar correspondence-filters"><label className="input correspondence-search"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, subject, party or officer"/></label><select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ACTIVE">Active records</option><option value="ALL">All records</option><option value="REGISTERED">Registered</option><option value="ASSIGNED">Assigned</option><option value="DRAFTING_RESPONSE">Drafting response</option><option value="RESPONDED">Responded</option><option value="ARCHIVED">Archived</option></select></div>
    <section className="correspondence-list">{filtered.map((record) => { const responsible = record.assignedTo?.id === actorUserId; const due = record.responseDueAt ? new Date(record.responseDueAt) : undefined; const late = due && due < new Date() && !["RESPONDED", "ARCHIVED"].includes(record.status); return <article className="panel correspondence-card" key={record.id}><div className="correspondence-summary"><div><div className="correspondence-badges"><span className={`badge ${record.status === "RESPONDED" ? "verified" : late ? "disputed" : "provisional"}`}>{record.status.replaceAll("_", " ")}</span><span className="badge">{record.classification}</span><span className="badge">{record.direction}</span></div><h2>{record.subject}</h2><p>{record.referenceNumber} · {record.senderOrRecipient}</p>{record.summary && <p>{record.summary}</p>}</div><div className="task-facts"><strong>{record.assignedTo?.displayName ?? "Unassigned"}</strong><span>{new Date(record.receivedOrSentAt).toLocaleString("en-NG")}</span><span className={late ? "late" : ""}>{due ? `Response due ${due.toLocaleString("en-NG")}` : "No response deadline"}</span></div></div><div className="correspondence-actions">{canManage && record.status !== "ARCHIVED" && <form action={act.bind(null, record.id, "ASSIGN")}><select name="assignedToId" className="input" defaultValue={record.assignedTo?.id ?? ""} disabled={disabled} required><option value="">Select responsible officer</option>{members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}</select><button className="button secondary" disabled={disabled}>Assign</button></form>}{(canManage || responsible) && !["RESPONDED", "ARCHIVED"].includes(record.status) && <form className="response-form" action={act.bind(null, record.id, "SAVE_RESPONSE")}><textarea name="responseDraft" className="input" rows={3} minLength={5} maxLength={25000} defaultValue={record.responseDraft} placeholder="Draft the institutional response" disabled={disabled} required/><button className="button secondary" disabled={disabled}>Save draft</button></form>}{(canManage || responsible) && record.status === "DRAFTING_RESPONSE" && <form action={act.bind(null, record.id, "MARK_RESPONDED")}><button className="button" disabled={disabled}>Mark responded</button></form>}{canManage && record.status !== "ARCHIVED" && <form action={act.bind(null, record.id, "ARCHIVE")}><button className="button secondary" disabled={disabled}><Archive size={14}/>Archive</button></form>}{canManage && record.status === "ARCHIVED" && <form action={act.bind(null, record.id, "REOPEN")}><button className="button secondary" disabled={disabled}>Reopen record</button></form>}</div></article>; })}{filtered.length === 0 && <section className="panel empty-state"><h2>No matching correspondence</h2><p>Change the search or status filter, or register the first institutional record.</p></section>}</section>
  </>;
}


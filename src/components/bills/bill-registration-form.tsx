"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getBrowserAppwrite } from "@/lib/appwrite/client";

type Workspace = {
  role: string;
  institution: {
    id: string;
    name: string;
    sessions: { id: string; name: string }[];
    documents: { id: string; title: string; documentId: string; verification: string }[];
  };
};

export function BillRegistrationForm({ configured }: { configured: boolean }) {
  const [jwt, setJwt] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [message, setMessage] = useState(configured ? "Checking your institutional access…" : "Appwrite and PostgreSQL must be configured before records can be saved.");
  const [error, setError] = useState(!configured);
  const [busy, setBusy] = useState(false);
  const workspace = useMemo(() => workspaces.find((item) => item.institution.id === institutionId), [workspaces, institutionId]);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    void (async () => {
      try {
        const token = await getBrowserAppwrite().account.createJWT({ duration: 900 });
        const response = await fetch("/api/workspaces", { headers: { Authorization: `Bearer ${token.jwt}` } });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Institutional access could not be loaded.");
        if (!active) return;
        setJwt(token.jwt);
        const permitted=(payload.data as Workspace[]).filter((item)=>["SUPER_ADMIN","INSTITUTION_ADMIN","LEGISLATOR","LEGISLATIVE_CLERK"].includes(item.role));
        setWorkspaces(permitted);
        setInstitutionId(permitted[0]?.institution.id ?? "");
        setMessage(permitted.length ? "Select verified intake information before saving." : "Your account has no bill-registration role.");
        setError(permitted.length === 0);
      } catch (caught) {
        if (!active) return;
        setError(true);
        setMessage(caught instanceof Error ? caught.message : "Sign in before accessing institutional workspaces.");
      }
    })();
    return () => { active = false; };
  }, [configured]);

  async function submit(formData: FormData) {
    if (!workspace || !jwt) return;
    setBusy(true); setError(false); setMessage("Saving the provisional research record…");
    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, "X-LegisCore-Institution-Id": workspace.institution.id },
        body: JSON.stringify({
          billNumber: formData.get("billNumber"), title: formData.get("title"), chamber: formData.get("chamber"),
          classification: formData.get("classification"), sessionId: formData.get("sessionId"),
          sourceDocumentId: formData.get("sourceDocumentId"), explanatoryMemorandum: formData.get("explanatoryMemorandum") || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "The bill could not be registered.");
      setMessage(`${payload.data.billNumber} was saved as a provisional research record.`);
    } catch (caught) {
      setError(true); setMessage(caught instanceof Error ? caught.message : "The bill could not be registered.");
    } finally { setBusy(false); }
  }

  const disabled = !configured || !workspace || !jwt || busy;
  return <form className="panel panel-body" action={submit}>
    <div className="source-grid">
      <div className="field"><label htmlFor="institution">Institutional workspace</label><select id="institution" className="input" value={institutionId} onChange={(event)=>setInstitutionId(event.target.value)} disabled={!workspaces.length}>{workspaces.map(({role,institution})=><option key={institution.id} value={institution.id}>{institution.name} · {role.replaceAll("_"," ")}</option>)}</select></div>
      <div className="field"><label htmlFor="sessionId">Assembly session</label><select id="sessionId" name="sessionId" className="input" disabled={disabled} required>{workspace?.institution.sessions.map((session)=><option key={session.id} value={session.id}>{session.name}</option>)}</select></div>
      <div className="field"><label htmlFor="number">Bill number</label><input id="number" name="billNumber" className="input" placeholder="e.g. SB 014" minLength={2} maxLength={80} disabled={disabled} required/></div>
      <div className="field"><label htmlFor="chamber">Originating chamber</label><select id="chamber" name="chamber" className="input" disabled={disabled}><option value="SENATE">Senate</option><option value="HOUSE">House of Representatives</option></select></div>
      <div className="field"><label htmlFor="title">Bill title</label><input id="title" name="title" className="input" placeholder="Full proposed title" minLength={10} maxLength={500} disabled={disabled} required/></div>
      <div className="field"><label htmlFor="classification">Classification</label><select id="classification" name="classification" className="input" disabled={disabled}><option value="ORDINARY">Ordinary</option><option value="SECTION_59_MONEY">Section 59 money bill</option><option value="SECTION_9_CONSTITUTION_ALTERATION">Section 9 constitutional alteration</option><option value="SECTION_8_STATE_CREATION_OR_BOUNDARY">Section 8 state creation or boundary</option></select></div>
      <div className="field"><label htmlFor="sourceDocumentId">Registration evidence</label><select id="sourceDocumentId" name="sourceDocumentId" className="input" disabled={disabled} required><option value="">Select a source document</option>{workspace?.institution.documents.map((document)=><option key={document.id} value={document.id}>{document.documentId} · {document.title} ({document.verification})</option>)}</select></div>
    </div>
    <div className="field"><label htmlFor="memo">Explanatory memorandum</label><textarea id="memo" name="explanatoryMemorandum" className="input" rows={6} maxLength={20_000} disabled={disabled}/></div>
    <div className={`form-message ${error ? "error" : ""}`} role="status">{message}{error && !configured && <> <Link className="panel-link" href="/login">Review sign-in setup</Link>.</>}</div>
    <button className="button" disabled={disabled}>{busy ? "Saving…" : "Save provisional record"}</button>
  </form>;
}

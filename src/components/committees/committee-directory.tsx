"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { getBrowserAppwrite } from "@/lib/appwrite/client";

type Workspace = { role: string; institution: { id: string; name: string } };
type Chamber = { id: string; name: string; code: string };
type Committee = {
  id: string;
  name: string;
  mandate?: string;
  chamber?: Chamber;
  _count: { referrals: number; hearings: number; reports: number; workflowTasks: number; meetings: number };
  meetings: { id: string; title: string; startsAt: string }[];
};

const readableRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "LEGISLATOR", "LEGISLATIVE_CLERK", "COMMITTEE_CHAIRPERSON", "COMMITTEE_SECRETARY", "LEGISLATIVE_RESEARCHER", "LEGAL_ADVISER", "POLICY_ANALYST"];

export function CommitteeDirectory({ configured }: { configured: boolean }) {
  const [jwt, setJwt] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(!configured);
  const [message, setMessage] = useState(configured ? "Checking committee access…" : "Connect Appwrite and PostgreSQL to activate institutional committee workspaces.");
  const workspace = useMemo(() => workspaces.find((item) => item.institution.id === institutionId), [institutionId, workspaces]);

  async function load(token: string, institution: string) {
    const response = await fetch("/api/committees", { headers: { Authorization: `Bearer ${token}`, "X-LegisCore-Institution-Id": institution } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? "Committees could not be loaded.");
    setCommittees(payload.data);
    setChambers(payload.meta.chambers);
    setCanManage(payload.meta.canManage);
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
        const allowed = (payload.data as Workspace[]).filter((item) => readableRoles.includes(item.role));
        if (!active) return;
        const remembered = sessionStorage.getItem("legiscoreInstitutionId");
        const first = allowed.some((item) => item.institution.id === remembered) ? remembered! : allowed[0]?.institution.id ?? "";
        setJwt(token.jwt);
        setWorkspaces(allowed);
        setInstitutionId(first);
        if (first) {
          await load(token.jwt, first);
          setError(false);
          setMessage("Institutional committee directory loaded.");
        } else {
          setError(true);
          setMessage("Your account has no committee workspace access.");
        }
      } catch (caught) {
        if (active) { setError(true); setMessage(caught instanceof Error ? caught.message : "Committees could not be loaded."); }
      }
    })();
    return () => { active = false; };
  }, [configured]);

  async function changeWorkspace(id: string) {
    setInstitutionId(id);
    sessionStorage.setItem("legiscoreInstitutionId", id);
    if (!jwt || !id) return;
    setBusy(true);
    try { await load(jwt, id); setError(false); setMessage("Institutional committee directory loaded."); }
    catch (caught) { setError(true); setMessage(caught instanceof Error ? caught.message : "Committees could not be loaded."); }
    finally { setBusy(false); }
  }

  async function createCommittee(formData: FormData) {
    if (!jwt || !institutionId) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/committees", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, "X-LegisCore-Institution-Id": institutionId }, body: JSON.stringify({ name: formData.get("name"), mandate: formData.get("mandate"), chamberId: formData.get("chamberId") || undefined }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Committee workspace could not be created.");
      await load(jwt, institutionId);
      setMessage(payload.message);
    } catch (caught) { setError(true); setMessage(caught instanceof Error ? caught.message : "Committee workspace could not be created."); }
    finally { setBusy(false); }
  }

  const disabled = !configured || !workspace || !jwt || busy;
  return <>
    <div className="review-banner"><div><strong>INTERNAL COMMITTEE OPERATIONS</strong><span>Workspace records and meetings are not official parliamentary proceedings unless separately supported by authoritative evidence.</span></div></div>
    <div className="field workspace-selector"><label htmlFor="committee-institution">Institutional workspace</label><select id="committee-institution" className="input" value={institutionId} onChange={(event) => void changeWorkspace(event.target.value)} disabled={!workspaces.length}>{workspaces.map((item) => <option key={item.institution.id} value={item.institution.id}>{item.institution.name} · {item.role.replaceAll("_", " ")}</option>)}</select></div>
    <div className={`form-message ${error ? "error" : ""}`} role="status">{message}</div>
    {canManage && <section className="panel committee-create"><div className="panel-header"><h2>Create committee workspace</h2><span className="badge provisional">INTERNAL RECORD</span></div><form className="panel-body committee-create-form" action={createCommittee}><div className="field"><label htmlFor="committee-name">Committee name</label><input id="committee-name" name="name" className="input" minLength={5} maxLength={240} disabled={disabled} required/></div><div className="field"><label htmlFor="committee-chamber">Chamber</label><select id="committee-chamber" name="chamberId" className="input" disabled={disabled}><option value="">Institution-wide / joint</option>{chambers.map((chamber) => <option key={chamber.id} value={chamber.id}>{chamber.name}</option>)}</select></div><div className="field wide"><label htmlFor="committee-mandate">Mandate</label><textarea id="committee-mandate" name="mandate" className="input" rows={3} minLength={10} maxLength={10000} disabled={disabled} required/></div><button className="button" disabled={disabled}><Plus size={15}/>{busy ? "Saving…" : "Create workspace"}</button></form></section>}
    <section className="committee-grid live-committee-grid">{committees.map((committee) => { const next = committee.meetings[0]; return <Link href={`/committees/${committee.id}`} className="committee-card" key={committee.id} onClick={() => sessionStorage.setItem("legiscoreInstitutionId", institutionId)}><span className="badge">{committee.chamber?.code ?? "JOINT / INSTITUTION"}</span><h2>{committee.name}</h2><p>{committee.mandate || "No mandate has been recorded."}</p><div className="card-meta"><div><span>Active referrals</span><strong>{committee._count.referrals}</strong></div><div><span>Meetings</span><strong>{committee._count.meetings}</strong></div><div><span>Next meeting</span><strong><CalendarDays size={12}/> {next ? new Date(next.startsAt).toLocaleString("en-NG") : "Not scheduled"}</strong></div><div><span>Open tasks</span><strong>{committee._count.workflowTasks}</strong></div></div></Link>; })}</section>
    {configured && !error && committees.length === 0 && <section className="panel empty-state"><h2>No committee workspaces yet</h2><p>An authorized clerk or administrator can create the first institution-scoped workspace.</p></section>}
  </>;
}


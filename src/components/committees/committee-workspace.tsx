"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { getBrowserAppwrite } from "@/lib/appwrite/client";

type Workspace = { role: string; institution: { id: string; name: string } };
type Member = { id: string; displayName: string; email: string };
type Meeting = { id: string; title: string; startsAt: string; venue?: string; virtualLink?: string; agenda?: unknown; accessLevel: string; isOfficialSitting: boolean; participants: { attended?: boolean; user: Member }[]; minutes?: { id: string; status: string } };
type Committee = { id: string; name: string; mandate?: string; chamber?: { name: string; code: string }; meetings: Meeting[]; workflowTasks: { id: string; title: string; status: string; priority: string; dueAt?: string }[]; referrals: { id: string; referralDate: string; expectedReportDate?: string; verification: string; bill: { id: string; billNumber: string; title: string } }[]; _count: { hearings: number; reports: number; meetings: number; workflowTasks: number } };
const roles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "LEGISLATOR", "LEGISLATIVE_CLERK", "COMMITTEE_CHAIRPERSON", "COMMITTEE_SECRETARY", "LEGISLATIVE_RESEARCHER", "LEGAL_ADVISER", "POLICY_ANALYST"];

export function CommitteeWorkspace({ committeeId, configured }: { committeeId: string; configured: boolean }) {
  const [jwt, setJwt] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [committee, setCommittee] = useState<Committee>();
  const [members, setMembers] = useState<Member[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(!configured);
  const [message, setMessage] = useState(configured ? "Loading committee workspace…" : "Connect Appwrite and PostgreSQL to activate this workspace.");

  const load = useCallback(async (token: string, institution: string) => {
    const response = await fetch(`/api/committees/${committeeId}`, { headers: { Authorization: `Bearer ${token}`, "X-LegisCore-Institution-Id": institution } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? (response.status === 404 ? "This committee is not available in the selected institution." : "Committee workspace could not be loaded."));
    setCommittee(payload.data); setMembers(payload.meta.members); setCanManage(payload.meta.canManage);
  }, [committeeId]);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    void (async () => {
      try {
        const token = await getBrowserAppwrite().account.createJWT({ duration: 900 });
        const response = await fetch("/api/workspaces", { headers: { Authorization: `Bearer ${token.jwt}` } });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Workspaces could not be loaded.");
        const allowed = (payload.data as Workspace[]).filter((item) => roles.includes(item.role));
        const remembered = sessionStorage.getItem("legiscoreInstitutionId");
        const ordered = remembered ? [...allowed.filter((item) => item.institution.id === remembered), ...allowed.filter((item) => item.institution.id !== remembered)] : allowed;
        let selected = "";
        for (const item of ordered) {
          try { await load(token.jwt, item.institution.id); selected = item.institution.id; break; } catch { /* try another authorized institution */ }
        }
        if (!active) return;
        setJwt(token.jwt); setInstitutionId(selected);
        if (!selected) throw new Error("This committee is not available in your institutional workspaces.");
        sessionStorage.setItem("legiscoreInstitutionId", selected);
        setError(false); setMessage("Internal committee workspace loaded.");
      } catch (caught) { if (active) { setError(true); setMessage(caught instanceof Error ? caught.message : "Committee workspace could not be loaded."); } }
    })();
    return () => { active = false; };
  }, [configured, load]);

  async function createMeeting(formData: FormData) {
    if (!jwt || !institutionId) return;
    setBusy(true); setError(false);
    try {
      const starts = String(formData.get("startsAt") || "");
      const virtualLink = String(formData.get("virtualLink") || "");
      const response = await fetch(`/api/committees/${committeeId}/meetings`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, "X-LegisCore-Institution-Id": institutionId }, body: JSON.stringify({ title: formData.get("title"), startsAt: new Date(starts).toISOString(), venue: formData.get("venue") || undefined, virtualLink: virtualLink || undefined, accessLevel: formData.get("accessLevel"), agenda: String(formData.get("agenda") || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean), participantIds: formData.getAll("participantIds") }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Meeting could not be scheduled.");
      await load(jwt, institutionId); setMessage(payload.message);
    } catch (caught) { setError(true); setMessage(caught instanceof Error ? caught.message : "Meeting could not be scheduled."); }
    finally { setBusy(false); }
  }

  const agendaItems = (agenda: unknown) => Array.isArray(agenda) ? agenda.filter((item): item is string => typeof item === "string") : [];
  return <>
    <div className="page-header"><div><p className="eyebrow">Committee secretariat</p><h1>{committee?.name ?? "Committee workspace"}</h1><p className="subtitle">{committee?.mandate ?? "Institution-scoped meetings, referrals, assignments, minutes and committee records."}</p></div><Link className="button secondary" href="/committees">All committees</Link></div>
    <div className="review-banner"><div><strong>INTERNAL WORKSPACE — NOT AN OFFICIAL PARLIAMENTARY SITTING</strong><span>Formal committee actions require separately verified institutional evidence.</span></div></div>
    <div className={`form-message ${error ? "error" : ""}`} role="status">{message}</div>
    {committee && <><section className="metric-grid"><article className="metric-card"><div className="metric-label">Meetings</div><div className="metric-value">{committee._count.meetings}</div><div className="metric-change">Internal calendar</div></article><article className="metric-card"><div className="metric-label">Open tasks</div><div className="metric-value">{committee.workflowTasks.length}</div><div className="metric-change">Secretariat assignments</div></article><article className="metric-card"><div className="metric-label">Referrals</div><div className="metric-value">{committee.referrals.length}</div><div className="metric-change">Evidence status shown</div></article><article className="metric-card"><div className="metric-label">Reports</div><div className="metric-value">{committee._count.reports}</div><div className="metric-change">Recorded outputs</div></article></section>
    {canManage && <section className="panel meeting-create"><div className="panel-header"><h2>Schedule internal meeting</h2><span className="badge provisional">NOT A SITTING</span></div><form className="panel-body meeting-form" action={createMeeting}><div className="field"><label htmlFor="meeting-title">Meeting title</label><input id="meeting-title" name="title" className="input" minLength={5} maxLength={300} disabled={busy} required/></div><div className="field"><label htmlFor="meeting-start">Date and time</label><input id="meeting-start" name="startsAt" className="input" type="datetime-local" disabled={busy} required/></div><div className="field"><label htmlFor="meeting-venue">Venue</label><input id="meeting-venue" name="venue" className="input" maxLength={500} disabled={busy}/></div><div className="field"><label htmlFor="meeting-link">Virtual meeting link</label><input id="meeting-link" name="virtualLink" className="input" type="url" disabled={busy}/></div><div className="field"><label htmlFor="meeting-access">Access</label><select id="meeting-access" name="accessLevel" className="input" disabled={busy}><option>INSTITUTIONAL</option><option>RESTRICTED</option><option>CONFIDENTIAL</option></select></div><div className="field"><label htmlFor="meeting-participants">Participants</label><select id="meeting-participants" name="participantIds" className="input multi-select" multiple disabled={busy}>{members.map((member) => <option key={member.id} value={member.id}>{member.displayName} · {member.email}</option>)}</select></div><div className="field wide"><label htmlFor="meeting-agenda">Agenda — one item per line</label><textarea id="meeting-agenda" name="agenda" className="input" rows={5} minLength={2} disabled={busy} required/></div><button className="button" disabled={busy}>{busy ? "Scheduling…" : "Schedule meeting"}</button></form></section>}
    <div className="committee-workspace-grid"><section className="panel"><div className="panel-header"><h2>Meeting calendar</h2><span className="badge">{committee.chamber?.code ?? "JOINT"}</span></div><div className="panel-body meeting-list">{committee.meetings.map((meeting) => <article key={meeting.id}><div><span className="badge provisional">{meeting.accessLevel}</span><h3>{meeting.title}</h3><p><CalendarDays size={13}/> {new Date(meeting.startsAt).toLocaleString("en-NG")} {meeting.venue && <><MapPin size={13}/> {meeting.venue}</>}</p><p><Users size={13}/> {meeting.participants.length} participants · Minutes {meeting.minutes?.status.replaceAll("_", " ") ?? "not recorded"}</p></div><ol>{agendaItems(meeting.agenda).map((item, index) => <li key={`${meeting.id}-${index}`}>{item}</li>)}</ol></article>)}{committee.meetings.length === 0 && <p className="empty-copy">No meetings scheduled.</p>}</div></section><aside className="panel"><div className="panel-header"><h2>Referrals and tasks</h2></div><div className="panel-body compact-records">{committee.referrals.map((referral) => <div key={referral.id}><span className="badge">{referral.verification}</span><strong>{referral.bill.billNumber} · {referral.bill.title}</strong><small>Referred {new Date(referral.referralDate).toLocaleDateString("en-NG")}</small></div>)}{committee.workflowTasks.map((task) => <div key={task.id}><span className="badge provisional">{task.status.replaceAll("_", " ")}</span><strong>{task.title}</strong><small>{task.priority}{task.dueAt ? ` · due ${new Date(task.dueAt).toLocaleString("en-NG")}` : ""}</small></div>)}{!committee.referrals.length && !committee.workflowTasks.length && <p className="empty-copy">No active referrals or assignments.</p>}</div></aside></div></>}
  </>;
}


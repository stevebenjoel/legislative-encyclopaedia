"use client";
import { useEffect, useState } from "react";
import { Paperclip, Send, ShieldCheck } from "lucide-react";
import { getBrowserAppwrite } from "@/lib/appwrite/client";

type Workspace = { role: string; institution: { id: string; name: string } };
type Citation = { sourceDocumentId: string; documentId: string; title: string; publisher?: string; sourceUrl?: string; version: number; integrityHash: string };
const aiRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "LEGISLATOR", "LEGISLATIVE_CLERK", "COMMITTEE_CHAIRPERSON", "COMMITTEE_SECRETARY", "LEGISLATIVE_RESEARCHER", "LEGAL_ADVISER", "POLICY_ANALYST"];

export function ResearchAssignment({ initialTask = "research", configured, model }: { initialTask?: string; configured: boolean; model: string }) {
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState(configured ? "Sign in to initialize the governed AI workspace." : "OpenRouter or institutional authentication is not fully configured. You can still save the assignment locally.");
  const [jwt, setJwt] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    void (async () => {
      try {
        const token = await getBrowserAppwrite().account.createJWT({ duration: 900 });
        const response = await fetch("/api/workspaces", { headers: { Authorization: `Bearer ${token.jwt}` } });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Institutional workspaces could not be loaded.");
        const allowed = (payload.data as Workspace[]).filter((item) => aiRoles.includes(item.role));
        if (!active) return;
        setJwt(token.jwt); setWorkspaces(allowed);
        const first = allowed[0]?.institution.id ?? ""; setInstitutionId(first);
        setMessage(first ? `OpenRouter ${model} is ready. Responses require human review.` : "Your account has no institutional AI role.");
      } catch (error) { if (active) setMessage(error instanceof Error ? error.message : "AI workspace initialization failed."); }
    })();
    return () => { active = false; };
  }, [configured, model]);

  function saveLocal() {
    if (prompt.trim().length < 10) { setMessage("Describe the assignment in at least ten characters."); return; }
    const assignments = JSON.parse(localStorage.getItem("legiscore-ai-assignments") ?? "[]") as unknown[];
    assignments.push({ task: initialTask, prompt: prompt.trim(), savedAt: new Date().toISOString(), status: "PROVIDER_PENDING" });
    localStorage.setItem("legiscore-ai-assignments", JSON.stringify(assignments));
    setMessage("Assignment saved locally. It has not been submitted to a model.");
  }

  async function submit() {
    if (!configured || !jwt || !institutionId) { saveLocal(); return; }
    if (prompt.trim().length < 10) { setMessage("Describe the assignment in at least ten characters."); return; }
    setBusy(true); setMessage("Generating a source-controlled response…");
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, "X-LegisCore-Institution-Id": institutionId }, body: JSON.stringify({ task: initialTask, prompt: prompt.trim(), conversationId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "The AI request failed.");
      setAnswer(payload.data.answer); setCitations(payload.data.citations); setConversationId(payload.data.conversationId); setMessage(payload.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The AI request failed."); }
    finally { setBusy(false); }
  }

  return <div className="copilot-layout"><section className="panel chat-panel"><div className="panel-header"><div><h2>{initialTask.replaceAll("-", " ")} assignment</h2>{workspaces.length > 0 && <select className="input ai-workspace-select" value={institutionId} onChange={(event) => setInstitutionId(event.target.value)}>{workspaces.map((workspace) => <option key={workspace.institution.id} value={workspace.institution.id}>{workspace.institution.name}</option>)}</select>}</div><span className={`badge ${configured ? "verified" : "provisional"}`}>{configured ? model : "Provider pending"}</span></div>{answer ? <div className="ai-answer"><div className="review-banner"><div><strong>AI-GENERATED RESPONSE — HUMAN REVIEW REQUIRED</strong><span>This is research assistance, not an official legal or parliamentary determination.</span></div></div><div className="ai-answer-text">{answer}</div>{citations.length > 0 && <div className="ai-citations"><h3>Verified sources supplied to the model</h3>{citations.map((citation, index) => <article key={citation.sourceDocumentId}><strong>[{index + 1}] {citation.title}</strong><span>{citation.documentId} · version {citation.version}</span>{citation.sourceUrl && <a href={citation.sourceUrl} target="_blank" rel="noreferrer">Open source</a>}</article>)}</div>}</div> : <div className="chat-empty"><ShieldCheck size={34}/><h2>Prepare a governed assignment</h2><p>Only verified, institution-authorized source excerpts are supplied to the model. Missing evidence must be disclosed rather than invented.</p></div>}<div className="composer"><button type="button" aria-label="Attach a document" disabled title="Use governed document intake to add source material"><Paperclip size={17}/></button><textarea aria-label="Message" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the legislative assignment…" disabled={busy}/><button type="button" aria-label={configured ? "Generate response" : "Save assignment locally"} onClick={() => void submit()} disabled={busy}><Send size={17}/></button></div><div className="form-message copilot-message" role="status">{message}</div></section><aside className="panel source-rail"><div className="panel-header"><h2>Source controls</h2></div><div className="panel-body"><ShieldCheck size={24}/><h3>Verified retrieval required</h3><p>Legal and factual claims must cite an identifiable source. Confidential material is filtered by user and institution before retrieval.</p><ul><li>No fabricated provisions</li><li>No invented votes or proceedings</li><li>No automatic official status</li><li>Human approval is mandatory</li></ul></div></aside></div>;
}

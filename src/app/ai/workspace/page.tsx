import { ResearchAssignment } from "@/components/ai/research-assignment";
export const metadata={title:"AI workspace | LegisCore"};
export default async function AIWorkspace({searchParams}:PageProps<"/ai/workspace">){const params=await searchParams;const task=typeof params.task==="string"?params.task:"research";return <main><div className="page-header"><div><p className="eyebrow">LegisCore AI Copilot</p><h1>Research workspace</h1><p className="subtitle">A guarded workspace for legislative research, drafting and document analysis.</p></div></div><ResearchAssignment initialTask={task}/></main>}

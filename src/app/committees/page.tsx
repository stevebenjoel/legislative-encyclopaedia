import { CommitteeDirectory } from "@/components/committees/committee-directory";
import { isAppwriteConfigured, serverEnv } from "@/config/env";
export const metadata={title:"Parliamentary Committees"};
export default function CommitteesPage(){return <main><div className="page-header"><div><p className="eyebrow">Committee operations</p><h1>Parliamentary committees</h1><p className="subtitle">Institution-scoped secretariat workspaces for meetings, referrals, assignments, evidence and reporting.</p></div></div><CommitteeDirectory configured={isAppwriteConfigured&&Boolean(serverEnv.databaseUrl)}/></main>}

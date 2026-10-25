import { SourceIntake } from "@/components/knowledge/source-intake";
import { isAppwriteConfigured, serverEnv } from "@/config/env";
export const metadata={title:"Source intake"};
export default function SourceIntakePage(){const configured=isAppwriteConfigured&&Boolean(serverEnv.databaseUrl&&serverEnv.appwriteApiKey&&serverEnv.storageBucketId);return <main><div className="page-header"><div><p className="eyebrow">Knowledge governance</p><h1>Document and source intake</h1><p className="subtitle">Upload institution-scoped evidence, preserve an immutable integrity hash and record a human verification decision without exposing private storage objects.</p></div></div><SourceIntake configured={configured}/></main>}

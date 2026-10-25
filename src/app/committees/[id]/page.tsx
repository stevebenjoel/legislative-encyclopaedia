import { CommitteeWorkspace } from "@/components/committees/committee-workspace";
import { isAppwriteConfigured, serverEnv } from "@/config/env";

export const metadata = { title: "Committee workspace" };

export default async function CommitteePage({ params }: PageProps<"/committees/[id]">) {
  const { id } = await params;
  return <main><CommitteeWorkspace committeeId={id} configured={isAppwriteConfigured && Boolean(serverEnv.databaseUrl)} /></main>;
}


import Link from "next/link";
import { BookOpen } from "lucide-react";
import { DemoBanner } from "@/components/ui/demo-banner";
import { KnowledgeDirectory } from "@/components/knowledge/knowledge-directory";
export const metadata={title:"Legislative Knowledge Centre"};
export default function KnowledgePage(){return <main><div className="page-header"><div><p className="eyebrow">Verified knowledge infrastructure</p><h1>Legislative Knowledge Centre</h1><p className="subtitle">Search constitutional provisions, federal laws, parliamentary procedure and research sources with explicit provenance and verification status.</p></div><Link className="button secondary" href="/knowledge/intake"><BookOpen size={15}/>Source intake</Link></div><DemoBanner/><KnowledgeDirectory/></main>}

import Link from "next/link";
import { Plus } from "lucide-react";
import { DemoBanner } from "@/components/ui/demo-banner";
import { BillDirectory } from "@/components/bills/bill-directory";
export const metadata={title:"Bills and Legislation"};
export default function BillsPage(){return <main><div className="page-header"><div><p className="eyebrow">Bicameral bill registry</p><h1>Bills & legislation</h1><p className="subtitle">Separate Senate and House histories, evidence-backed events, version control and configurable Nigerian legislative workflows.</p></div><Link className="button" href="/bills/new"><Plus size={15}/>Register bill</Link></div><DemoBanner/><BillDirectory/></main>}

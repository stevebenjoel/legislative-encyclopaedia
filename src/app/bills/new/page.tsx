import { DemoBanner } from "@/components/ui/demo-banner";
import { BillRegistrationForm } from "@/components/bills/bill-registration-form";
import { isAppwriteConfigured, serverEnv } from "@/config/env";
export const metadata={title:"Register Bill"};
export default function NewBillPage(){return <main><div className="page-header"><div><p className="eyebrow">Controlled legislative intake</p><h1>Register a proposed bill</h1><p className="subtitle">Registration creates a research record only. It does not constitute formal introduction before either chamber.</p></div></div><DemoBanner/><BillRegistrationForm configured={isAppwriteConfigured&&Boolean(serverEnv.databaseUrl)}/></main>}

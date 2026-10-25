import Link from "next/link";
import { Search } from "lucide-react";
import { demoBills, legalSources } from "@/lib/demo-data";

export const metadata = { title: "Search" };
const modules = [
  { title: "Bills and legislation", description: "Bicameral bill records and histories", href: "/bills" },
  { title: "Legislative Knowledge Centre", description: "Constitutional, legal and procedural sources", href: "/knowledge" },
  { title: "Parliamentary committees", description: "Committee secretariat workspaces", href: "/committees" },
  { title: "Smart workflow", description: "Tasks, approvals and internal operations", href: "/workflow" },
  { title: "Legislative correspondence", description: "Institutional incoming and outgoing register", href: "/workflow/correspondence" },
  { title: "AI legislative copilot", description: "Guarded drafting and research assignments", href: "/ai" },
  { title: "Performance intelligence", description: "Evidence and data-coverage analytics", href: "/performance" },
];

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const normalized = query.toLowerCase();
  const results = normalized ? [
    ...demoBills.filter((item) => `${item.title} ${item.number} ${item.summary} ${item.chamber}`.toLowerCase().includes(normalized)).map((item) => ({ title: item.title, description: `${item.number} · ${item.chamber} · ${item.stage}`, href: `/bills/${item.id}`, type: "Bill" })),
    ...legalSources.filter((item) => `${item.title} ${item.type} ${item.authority} ${item.coverage}`.toLowerCase().includes(normalized)).map((item) => ({ title: item.title, description: `${item.type} · ${item.status}`, href: "/knowledge", type: "Source" })),
    ...modules.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(normalized)).map((item) => ({ ...item, type: "Module" })),
  ] : [];
  return <main><div className="page-header"><div><p className="eyebrow">Unified discovery</p><h1>Search LegisCore</h1><p className="subtitle">Search public demonstration bills, legal sources, and available platform modules. Restricted institutional records remain outside public search.</p></div></div><form className="panel search-page-form" action="/search"><Search size={18}/><input name="q" defaultValue={query} minLength={2} placeholder="Enter a bill number, legal source, subject, or module" required/><button className="button">Search</button></form>{query&&<p className="search-result-count">{results.length} result{results.length===1?"":"s"} for “{query}”</p>}<section className="search-results">{results.map((result)=><Link className="panel search-result" href={result.href} key={`${result.type}-${result.title}`}><span className="badge">{result.type}</span><h2>{result.title}</h2><p>{result.description}</p></Link>)}{query&&results.length===0&&<section className="panel empty-state"><h2>No public results found</h2><p>Try a bill number, title, legal source, or module name. Sign in to access permitted institutional records within their own workspaces.</p></section>}{!query&&<section className="panel empty-state"><Search size={34}/><h2>Enter a search term</h2><p>Public search deliberately excludes restricted workflow, confidential correspondence, and internal documents.</p></section>}</section></main>;
}

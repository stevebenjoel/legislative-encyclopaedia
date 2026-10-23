export const demoLabel = "DEMONSTRATION DATA — NOT AN OFFICIAL LEGISLATIVE RECORD";

export const dashboardMetrics = [
  { label: "Bills tracked", value: "128", change: "+12 this session" },
  { label: "Verified sources", value: "46", change: "91% coverage reviewed" },
  { label: "Active committees", value: "18", change: "7 referrals due" },
  { label: "Pending verification", value: "23", change: "Requires human review" },
];

export const demoBills = [
  { id: "national-primary-healthcare-access-bill", number: "SB DEMO 014", title: "National Primary Healthcare Access Bill, 2026", chamber: "Senate", classification: "Ordinary bill", stage: "Committee referral", progress: 48, verification: "PROVISIONAL", updated: "21 October 2026", sponsor: "Fictional sponsor", committee: "Committee on Health (Demonstration)", summary: "A fictional proposal illustrating equitable access, funding accountability and service standards for primary healthcare facilities.", events: [{ name: "Registered", date: "03 Sep 2026", status: "VERIFIED" }, { name: "First reading", date: "15 Sep 2026", status: "PROVISIONAL" }, { name: "Second reading passed", date: "08 Oct 2026", status: "PROVISIONAL" }, { name: "Committee referred", date: "08 Oct 2026", status: "PROVISIONAL" }] },
  { id: "digital-learning-infrastructure-bill", number: "HB DEMO 031", title: "Digital Learning Infrastructure Bill, 2026", chamber: "House", classification: "Ordinary bill", stage: "Second reading", progress: 31, verification: "UNVERIFIED", updated: "18 October 2026", sponsor: "Fictional sponsor", committee: "Not yet referred", summary: "A fictional education reform proposal used to demonstrate chamber-specific bill tracking and source verification.", events: [{ name: "Registered", date: "29 Sep 2026", status: "PROVISIONAL" }, { name: "First reading", date: "07 Oct 2026", status: "UNVERIFIED" }] },
  { id: "agricultural-resilience-fund-bill", number: "SB DEMO 022", title: "Agricultural Resilience Fund Bill, 2026", chamber: "Senate", classification: "Money bill — classification provisional", stage: "Source review", progress: 14, verification: "DISPUTED", updated: "17 October 2026", sponsor: "Fictional sponsor", committee: "Not assigned", summary: "A fictional proposal demonstrating the restrictions applied when a legally significant classification is not verified.", events: [{ name: "Registered", date: "11 Oct 2026", status: "UNVERIFIED" }] },
];

export const legalSources = [
  { title: "Constitution of the Federal Republic of Nigeria, 1999 (as amended)", type: "Constitution", authority: "Federal Republic of Nigeria", status: "PROVISIONAL", coverage: "Sections 1–320 and schedules", updated: "Source authentication in progress" },
  { title: "National Assembly Legislative Process", type: "Procedure guide", authority: "National Assembly", status: "PROVISIONAL", coverage: "Public legislative process overview", updated: "Retrieved 23 October 2026" },
  { title: "House Standing Orders — 9th Edition", type: "Historical Standing Orders", authority: "House of Representatives", status: "SUPERSEDED", coverage: "Historical research only", updated: "Not represented as current" },
  { title: "Step-by-Step Guide to Constitutional Alteration", type: "Research guide", authority: "PLAC", status: "UNVERIFIED", coverage: "Section 9 process commentary", updated: "Awaiting legal review" },
];

export const committees = [
  { name: "Health Services", chamber: "Senate", referrals: 4, hearings: 2, next: "24 Oct · 10:00", status: "Demonstration" },
  { name: "Education and Human Capital", chamber: "House", referrals: 7, hearings: 1, next: "28 Oct · 12:00", status: "Demonstration" },
  { name: "Agriculture and Food Security", chamber: "Joint", referrals: 3, hearings: 0, next: "No hearing scheduled", status: "Demonstration" },
];

import { isAppwriteConfigured } from "@/config/env";

const checks = [
  ["Application framework", "Next.js 16 + TypeScript"],
  ["Production runtime", "Docker / Coolify"],
  ["Backend services", "Appwrite"],
  ["Deployment health", "/api/health"],
] as const;

export default function Home() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">LEGISLATIVE ENCYCLOPAEDIA</p>
        <h1>Build environment ready.</h1>
        <p className="lede">
          The production foundation is in place. Domain routing and live Appwrite
          resources can be connected when their details are available.
        </p>
        <div className="status" aria-live="polite">
          <span className={isAppwriteConfigured ? "dot ready" : "dot"} />
          Appwrite {isAppwriteConfigured ? "environment detected" : "awaiting configuration"}
        </div>
      </section>

      <section className="grid" aria-label="Environment summary">
        {checks.map(([label, value]) => (
          <article key={label}>
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
    </main>
  );
}

# Legislative Encyclopaedia

LegisCore Nigeria is an independent legislative intelligence and parliamentary
technology platform. The current milestone provides a working Phase A product
foundation with Next.js, TypeScript, Tailwind CSS, Appwrite identity/storage,
PostgreSQL, Prisma ORM, and a Docker deployment designed for Coolify.

LegisCore is **not** an official National Assembly platform. Demonstration records
are fictional and are labelled accordingly. Official institutional capabilities
remain disabled until formally authorized.

## Local development

Requirements: Node.js 22+, pnpm 11, and PostgreSQL 17 (or Docker).

```bash
cp .env.example .env.local
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`. Read-only demonstration screens build and run before
Appwrite or PostgreSQL are configured. Writes and authentication become active only
after their environment values and infrastructure are connected.

## Architecture

- **Next.js App Router:** server-rendered application and validated API routes.
- **Appwrite:** user identity, sessions, email verification, MFA, and object storage.
- **PostgreSQL + Prisma:** normalized legislative records, workflow history,
  institutions, permissions, citations, document metadata, and append-only audits.
- **Zod:** request validation at API boundaries.
- **Vitest:** permission and legislative workflow safety tests.
- **Docker/Coolify:** reproducible production container and health checks.

The hybrid backend preserves Appwrite as the platform service while using relational
integrity for legally consequential legislative records.

## Environment variables

Copy `.env.example` and fill in values when the Appwrite project is available.

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Browser + server | Canonical application URL |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Browser + server | Appwrite API endpoint ending in `/v1` |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Browser + server | Appwrite project ID |
| `DATABASE_URL` | Server only, secret | PostgreSQL connection string |
| `APPWRITE_API_KEY` | Server only, secret | Administrative server operations |
| `APPWRITE_DATABASE_ID` | Server only | Primary database ID |
| `APPWRITE_LEGISLATION_COLLECTION_ID` | Server only | Legislation collection ID |
| `APPWRITE_LEGISLATORS_COLLECTION_ID` | Server only | Legislators collection ID |
| `APPWRITE_STORAGE_BUCKET_ID` | Server only | Documents/media bucket ID |

Never expose `APPWRITE_API_KEY` with a `NEXT_PUBLIC_` prefix or commit a populated
environment file.

## Appwrite connection checklist (later)

1. Create or select an Appwrite project.
2. Add `localhost` as a Web platform for local development.
3. Add the production hostname as a Web platform when the domain is known.
4. Create the database, collections, indexes, permissions, and storage bucket.
5. Create a narrowly scoped server API key for only the operations the application needs.
6. Add the resulting values to `.env.local` and to Coolify.

Browser SDK helpers live in `src/lib/appwrite/client.ts`; server-only admin and
session helpers live in `src/lib/appwrite/server.ts`.

## Current implementation milestone

Implemented and tested:

- Responsive institutional application shell and dashboard.
- Legislative Knowledge Centre source register.
- Senate and House bill registry with separate event histories.
- Committee workspace overview.
- Appwrite registration and sign-in forms (activated by configuration).
- Institution-scoped role and permission policy.
- Configurable, evidence-required legislative transition engine.
- Comprehensive initial Prisma schema covering the entities in the master brief.
- Demonstration-only records with explicit non-official labels.
- AI workspace safety boundary pending provider and corpus approval.
- AI Copilot launcher, guarded research workspace and bill-drafting brief.
- Performance dashboard with verification, coverage and exclusion disclosures.
- Smart Workflow dashboard and tested task state-transition rules.
- Unified relational models for AI artifacts and review, performance methodology,
  member profiles, tasks, meetings, approvals, correspondence and audit events.

Still dependent on external configuration or future milestones:

- Live Appwrite project, email verification and MFA policy.
- Live PostgreSQL migration and seed execution.
- Real legal-source ingestion and authentication.
- Production document upload/malware scanning pipeline.
- AI provider, embeddings, vector search and human-review operations.
- Authenticated CRUD services for the new AI, workflow and performance records.
- Oversight, budget, academy and citizen-engagement workflows.

## Coolify deployment (when ready)

Create an application from this GitHub repository with these settings:

- Build Pack: `Dockerfile`
- Branch: `main`
- Dockerfile Location: `/Dockerfile`
- Base Directory: `/`
- Ports Exposes: `3000`
- Health endpoint: `GET /api/health` (already included in the image)

Add every variable from `.env.example` in Coolify. Mark `APPWRITE_API_KEY` as a
secret. Mark `DATABASE_URL` as a secret as well. The three `NEXT_PUBLIC_*` values must be available at build time because
Next.js embeds them into the browser bundle. In Coolify, configure these as build
variables/build arguments as well as runtime variables.

The container listens on `0.0.0.0:3000`, runs as an unprivileged user, and ships
with a Docker health check suitable for Coolify rolling deployments.

Do not add the final domain until DNS and Appwrite platform configuration are ready.

## Commands

```bash
pnpm lint       # lint source files
pnpm typecheck  # verify TypeScript
pnpm build      # create production build
pnpm test       # run workflow and permission safeguards
pnpm db:validate # validate the legislative database contract
pnpm start      # run production server after a local build
```

Docker can also be tested locally:

```bash
docker compose up --build
```

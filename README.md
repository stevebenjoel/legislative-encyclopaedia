# Legislative Encyclopaedia

Production-ready foundation for the Legislative Encyclopaedia, built with Next.js,
TypeScript, Appwrite, and a Docker deployment designed for Coolify.

## Local development

Requirements: Node.js 22+ and pnpm 11.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The application can build and run before Appwrite is
configured; it will show that the backend is awaiting configuration.

## Environment variables

Copy `.env.example` and fill in values when the Appwrite project is available.

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Browser + server | Canonical application URL |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Browser + server | Appwrite API endpoint ending in `/v1` |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Browser + server | Appwrite project ID |
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

## Coolify deployment (when ready)

Create an application from this GitHub repository with these settings:

- Build Pack: `Dockerfile`
- Branch: `main`
- Dockerfile Location: `/Dockerfile`
- Base Directory: `/`
- Ports Exposes: `3000`
- Health endpoint: `GET /api/health` (already included in the image)

Add every variable from `.env.example` in Coolify. Mark `APPWRITE_API_KEY` as a
secret. The three `NEXT_PUBLIC_*` values must be available at build time because
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
pnpm start      # run production server after a local build
```

Docker can also be tested locally:

```bash
docker compose up --build
```

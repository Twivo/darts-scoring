# 🎯 DartsScore — Darts competition platform (501 / 601 Double Out)

Touch-first darts scoring app that grew from a local scorer into a small
competition platform: an event-sourced scoring engine, an admin area to manage
players, multi-season persistent statistics, and matches auto-saved to the
cloud so no game is ever lost.

Every stat (remaining score, averages, legs, checkouts…) is **recomputed** from
the event log by a pure engine — nothing derived is ever stored.

## Stack

React 18 · TypeScript (strict) · Vite 6 · TailwindCSS 4 · React Router 6 ·
Supabase (Postgres + Auth + RLS) · Vitest.

- **Local-only mode**: with no backend configured, the app runs entirely on
  LocalStorage (offline).
- **Cloud mode**: set the two `VITE_SUPABASE_*` env vars and it uses Supabase
  for players, seasons, matches and stats.

## Getting started

```bash
npm install
npm run dev      # dev server (http://localhost:5173)
npm run build    # production build (tsc + vite)
npm test         # unit tests (engine, rules, stats)
```

### Cloud backend (optional)

1. Create a Supabase project and run the SQL in
   [`supabase/migrations/`](supabase/migrations) (see
   [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md)).
2. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (the anon key is public by design — Row-Level
   Security protects all writes).

## Architecture

```
src/
├── domain/     Pure engine, rules, stats (no React, no I/O) + tests
├── data/       Repository + Auth interfaces, Supabase & Local implementations
├── store/      React state (game, roster, auth) + resilient match persistence
├── features/   UI by area: home · setup · game · admin (players, dashboard)
└── components/ Shared UI
supabase/migrations/   Versioned SQL (schema, RLS, seasons)
```

- **Event-sourced**: a match persists only `{ config, events }`; the engine
  rebuilds everything. Season stats reuse the same engine — zero duplication.
- **Swappable backend**: features depend on `DartsRepository` / `AuthProvider`
  interfaces, never a concrete backend.
- **Security**: public read; player/season writes require the admin account;
  matches can be scored anonymously but only the admin can delete them (RLS).

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`.
For cloud mode, add two repository secrets
(**Settings → Secrets and variables → Actions**):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Routing uses `HashRouter`, so it works under any Pages path with no server
rewrites.

# Supabase setup (one-time, ~5 min)

The app evolves from local-only to a real platform (players, multi-season
stats, auto-saved matches) backed by Supabase. Anon key is **public by design**
— Row-Level Security protects all writes; only the single admin account can
write.

## 1. Create the project
1. Sign up / log in at https://supabase.com
2. **New project** → pick an EU region → set a database password (keep it).
3. Wait for provisioning (~1 min).

## 2. Run the schema
- Open **SQL Editor** → **New query**.
- Paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and **Run**.
- This creates `seasons`, `players`, `matches`, `match_players`, RLS policies,
  and seeds season **2026/2027**.

## 3. Create the admin account
- **Authentication → Users → Add user** → set an **email + password**.
- (Optional) Disable public sign-ups: **Authentication → Providers → Email** →
  turn off "Enable sign ups" so only this admin exists.

## 4. Give the app the keys
- **Project Settings → API**: copy **Project URL** and the **anon public** key.
- Create `.env.local` at the repo root (copy from `.env.example`):
  ```
  VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
  VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
  ```
- For the deployed site, add the same two as build env vars (GitHub Actions
  secrets / repository variables) — I'll wire the workflow.

## Future seasons
Just insert a row — no schema change:
```sql
insert into seasons (name, starts_on, ends_on, is_current)
values ('2027/2028','2027-09-01','2028-08-31', false);
```

# Museum of Your Real Life

Sprint 0 foundation for a private-first personal museum PWA.

## Stack

- Next.js App Router, TypeScript strict mode, React 19
- Tailwind CSS 4 with shadcn-style local UI primitives
- Supabase Auth, SSR clients, Postgres RLS
- React Hook Form and Zod
- Vitest, React Testing Library, Playwright

## Sprint 0 Scope

Included:

- Public routes: `/`, `/privacy`, `/terms`
- Auth routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`
- Protected user routes: `/app`, `/app/profile`, `/app/settings`
- Admin route: `/admin`, guarded by the `ADMIN` role
- PWA manifest and placeholder icons
- Supabase migration for `profiles`, `user_roles`, and `audit_logs`
- RLS policies, secure bootstrap trigger, and `is_admin()` helper

Not included:

- Museum items, uploads, galleries, sharing, comments, invitations, billing, or notifications

## Sprint 1 Scope

Added location and check-in foundation only:

- `/app/nearby` requests one-time browser geolocation, loads active nearby locations, and submits check-ins.
- `/app/check-ins` shows the user's check-in history.
- `/app/check-ins/[id]` shows a check-in result and memory summary.
- `/app` shows a check-in action, recent check-ins, total memories, and latest valid memory.
- `/admin` shows read-only counts for locations, check-ins, and suspicious check-ins.

Not included:

- Rewards, chests, inventory, collections, badges, or museum gameplay.

## Sprint 2 Scope

Added reward and inventory foundation only:

- `/app/check-ins/[id]/chest` opens a category reward chest for an eligible valid check-in.
- `/app/inventory` shows collected items, XP, level, and filters by category, rarity, and ownership.
- Valid check-ins become rewardable with `reward_status = PENDING`.
- Opening a chest calls trusted server/database logic and never lets the client choose item, rarity, XP, or quantity.
- Reopening the same chest returns the existing reward and does not reroll.

Not included:

- Collection completion, badges, museum customization, trading, item usage, or advanced reward animations.

## Environment

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase

Apply `supabase/migrations/0001_sprint_0_foundation.sql` to a Supabase project.
Then review and apply `supabase/migrations/0002_sprint_1_location_checkins.sql`.
Then review and apply `supabase/migrations/0003_sprint_2_reward_inventory.sql`.

The migration:

- Creates only the Sprint 0 tables: `profiles`, `user_roles`, `audit_logs`
- Enables RLS on all tables
- Creates a profile and `PLAYER` role when a Supabase Auth user is inserted
- Allows authenticated users to read their own profile and role
- Allows profile updates only for `display_name`, `avatar_key`, and `museum_visibility`
- Allows admins to read operational tables through `public.is_admin()`
- Keeps audit log inserts unavailable to browser-authenticated clients

Sprint 1 migration:

- Creates `location_categories`, `locations`, `check_ins`, `memories`, and `app_configurations`.
- Seeds development-only location categories, locations, and check-in configuration.
- Adds trusted RPCs for nearby location search, check-in processing, check-in history, and detail lookup.
- Blocks browser clients from directly inserting check-ins or memories.
- Creates exactly one memory for a valid check-in inside the same database function that records the check-in.

Sprint 2 migration:

- Creates `items`, `loot_tables`, `loot_table_items`, `reward_transactions`, `user_inventory`, `xp_transactions`, and `level_configurations`.
- Seeds development reward items, loot tables, rarity weights, duplicate XP, and 10 levels.
- Adds trusted RPCs for opening a check-in reward, reading an opened reward, and loading inventory.
- Updates valid check-ins to use `reward_status = PENDING` until the chest is opened.
- Blocks browser clients from directly inserting or updating rewards, inventory, or XP.

To make a user an admin, insert an `ADMIN` row using a service role or SQL editor:

```sql
insert into public.user_roles (user_id, role)
values ('00000000-0000-0000-0000-000000000000', 'ADMIN')
on conflict (user_id, role) do nothing;
```

## Development

```bash
npm install
npm run dev
```

## Deployment

After GitHub Pages deployment is enabled successfully, the game will be available here:

```text
https://museum-of-your-real-life.vercel.app/
```

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

For local verification without a real Supabase project, use syntactically valid placeholder public env values. Runtime auth flows require a real Supabase project and the migration applied.

## Security Notes

- The app uses `supabase.auth.getUser()` in middleware/server guards so protected routes are based on verified auth state.
- Middleware redirects anonymous users away from `/app` and `/admin`, and redirects authenticated users away from auth pages.
- Admin pages call `public.is_admin()` and redirect non-admin users to `/app`.
- Client profile writes use only the editable profile fields; the database also enforces column-level grants and RLS.
- Errors shown to users are sanitized and do not expose provider or database details.

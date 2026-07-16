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

## Environment

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase

Apply `supabase/migrations/0001_sprint_0_foundation.sql` to a Supabase project.

The migration:

- Creates only the Sprint 0 tables: `profiles`, `user_roles`, `audit_logs`
- Enables RLS on all tables
- Creates a profile and `PLAYER` role when a Supabase Auth user is inserted
- Allows authenticated users to read their own profile and role
- Allows profile updates only for `display_name`, `avatar_key`, and `museum_visibility`
- Allows admins to read operational tables through `public.is_admin()`
- Keeps audit log inserts unavailable to browser-authenticated clients

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

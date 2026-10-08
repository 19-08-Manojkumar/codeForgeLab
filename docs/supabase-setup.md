# Connect CodeForge Lab to Supabase

The app now runs as a normal Next.js application with server API routes. The existing private Sites deployment and D1 data have not been replaced. Vercel and Supabase configuration are separate from editing the code.

## 1. Create the project

In Supabase, select **New project**, choose your organization, name it **CodeForge Lab**, set a database password, and choose a nearby region. Keep the password private. GitHub sign-in to the dashboard is separate from student accounts.

Open **Connect → Next.js**. Create `.env.local` at the project root using the names in `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

The app uses the publishable key and each learner's verified session. No secret key, service-role key, database password, or direct PostgreSQL connection string is needed. Never put a privileged key in a `NEXT_PUBLIC_` variable.

## 2. Create the database tables

Open **SQL Editor → New query**, paste the entire contents of `supabase/migrations/202610080001_learning.sql`, and run it once. If you use the Supabase CLI, apply the same migration through it instead.

This creates `learning_state` and `learning_events`, enables Row Level Security, grants account-owned reads, and adds authenticated save functions. Functions derive ownership from `auth.uid()` and never accept another user's ID. Each update locks the learner's row, checks its revision, and records its permanent event ID in the same transaction. Repeated requests cannot double-count attempts or toggle bookmarks twice.

The first database version keeps bounded learning state in JSONB so profiles, completed lessons, daily practice, drafts, bookmarks, quizzes, and mistake-review schedules retain their format. Lessons and examples stay in project files. Practice scores are personal learning records, not verified examination results or certificate evidence.

## 3. Configure authentication

Enable the Email provider and email confirmation in **Authentication**. The app supports account creation, confirmation, email/password sign-in, sign-out, and password recovery.

Under **Authentication → URL Configuration**, use `http://localhost:3000` as Site URL while testing locally. Change it to `https://codeforge-lab.vercel.app` for production. Add these redirect URLs:

```text
http://localhost:3000/auth/**
https://codeforge-lab.vercel.app/auth/**
```

Default confirmation/recovery templates use `/auth/callback` with PKCE. Open the emailed link in the same browser that requested it. For links that also work in another browser, use these links in **Email Templates**, with Site URL set to the environment you are testing:

Confirm signup:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email">Confirm your email</a>
```

Reset password:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery">Reset your password</a>
```

The confirm route verifies the token; recovery opens `/auth/reset-password`. Redirect targets are restricted to the app's home and reset-password pages. Expired links show a recovery page. Configure your own SMTP delivery before opening registration broadly; Supabase's built-in delivery has testing restrictions and rate limits.

## 4. Run and check the app

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. Without Supabase settings, lessons still work as guest learning and the sign-in dialog explains that account sign-in is unavailable. With settings present, create and confirm a student account, sign in, practice a lesson, edit a code draft, and reload. Sign into the same account in a second browser to confirm restoration. A different account must not see its saved data. Try password recovery and sign-out too.

Guest progress is labelled as device-local. Signing in adds it to the account through a validated, idempotent import. Completed lessons and bookmarks are combined; existing account profiles and newer code drafts are preserved. Guest data is removed only after account saving succeeds. Unsent account changes have separate device outboxes keyed by account ID and can be retried after reload or sign-out. Restricted device storage cannot retain unsent work after closing the tab.

```sh
npm test
npm run test:browser
npm run build
npm start
```

Tests run the migration against embedded PostgreSQL, checking access policies and atomic save functions, along with request validation, retries, duplicates, guest import, and account switching. Real Supabase email delivery and Vercel configuration also need checking after setup.

## 5. Deploy on Vercel

Push from the standalone `codeforgelab` folder so `package.json` is at the GitHub repository root. Import that repository with Next.js as the framework and Root Directory set to `./`. If your repository instead contains a `codeforgelab` subfolder, select that subfolder as Root Directory. Use `npm run build`; leave Output Directory at its framework default. Add both environment variables before building. Redeploy after changing either public value, since Next.js includes them in the client build. Confirm the assigned domain matches authentication URL Configuration.

The old static-export/Worker packaging is not used by the new build. `server/worker.mjs`, D1 schema/migrations, and `start:legacy` remain for migration/reference. They are not an authentication source for Vercel. Next.js routes do not trust Site-dispatch identity headers.

## 6. Transfer existing D1 records

Keep the existing deployment/data while preparing migration. Export D1 `learning_state` rows as JSON with `user_id` and `state_json`. For a single student, their authenticated old `/api/learning` response gives their own `state`; the tool also accepts `{ "user_id": "your-export-label", "state": { ... } }` rows.

Create corresponding Supabase accounts first and verify each record's owner. Map each original ID/export label explicitly to the matching Supabase Auth user UUID. Do not infer identities from display names.

```json
{ "original-account-id": "existing-supabase-auth-user-uuid" }
```

Keep personal-data exports in ignored `.sites-runtime/`, outside source control. Generate SQL for review:

```sh
npm run db:migrate-legacy -- --source .sites-runtime/learning-export.json --mapping .sites-runtime/account-map.json --output .sites-runtime/reviewed-import.sql
```

Review mappings before running the SQL in Supabase. The tool validates records, escapes SQL literals, rejects missing/duplicate mappings, refuses to overwrite output files, and preserves existing Supabase records. It does not access either live database or delete D1 data. To retain permanent deduplication of every old event, also export D1 `learning_events` rows (`user_id`, `event_id`, `created_at`) and add `--events .sites-runtime/learning-events.json` to the command. Without that file, the retained 200 event IDs from each state are imported.

Sources: [Supabase Next.js authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route).

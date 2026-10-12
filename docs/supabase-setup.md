# Connect CodeForge Lab to Supabase

The app now runs as a normal Next.js application with server API routes. The existing private Sites deployment and D1 data have not been replaced. Vercel and Supabase configuration are separate from editing the code.

## 1. Connect the Supabase project

If you already connected Supabase to the `code-forge-lab` Vercel project, reuse that Supabase resource. Open **Vercel → Projects → code-forge-lab → Settings → Environment Variables** and check for both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The Marketplace integration can add them automatically. Check that both apply to **Production**; add **Preview** too if you want account features in branch previews.

To find missing values, click **Open in Supabase** on the Vercel database resource, then open **Connect → Next.js** in the Supabase dashboard. This shows your project URL and publishable key. **Project Settings → API Keys** also lists the publishable keys. Copy the values into Vercel using the exact variable names below. `SUPABASE_URL` alone is not the browser variable this app reads.

If you have no Supabase project yet, select **New project**, choose your organization, name it **CodeForge Lab**, set a database password, and choose a nearby region. GitHub sign-in to the dashboard is separate from student accounts.

Vercel's variables are enough for the hosted app. You do not need to copy them into source code or GitHub. They apply to new deployments, so redeploy after adding or changing them. The variables shown for Production and Preview do not configure your local development server.

Only if you want to run the app locally, put the same two public values in `codeforgelab/.env.local` using the names in `.env.example`, then restart the development server:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

The app uses the publishable key and each learner's verified session. No secret key, service-role key, database password, or direct PostgreSQL connection string is needed. Never put a privileged key in a `NEXT_PUBLIC_` variable.

Save the variables and redeploy Vercel after changing them. The integration does not run the application's SQL migration or configure its authentication URLs.

## 2. Create the database tables

Open **SQL Editor → New query**, paste the entire contents of `supabase/migrations/202610080001_learning.sql`, and run it once. If you use the Supabase CLI, apply the same migration through it instead.

This creates `learning_state` and `learning_events`, enables Row Level Security, grants account-owned reads, and adds authenticated save functions. Functions derive ownership from `auth.uid()` and never accept another user's ID. Each update locks the learner's row, checks its revision, and records its permanent event ID in the same transaction. Repeated requests cannot double-count attempts or toggle bookmarks twice.

The first database version keeps bounded learning state in JSONB so profiles, completed lessons, daily practice, drafts, bookmarks, quizzes, and mistake-review schedules retain their format. Lessons and examples stay in project files. Practice scores are personal learning records, not verified examination results or certificate evidence.

## 3. Configure authentication

Enable the Email provider, new user signups, and email confirmation in **Authentication**. Set the minimum password length to at least 8 characters. The app supports account creation, confirmation, email/password sign-in, sign-out, and password recovery.

Guests see one **Login** button in the header, with no automatic signup or guest-profile popup. Login opens the email/password form, with **Create an account** and **Forgot password?** available inside that dialog. Signup collects the learner's name, email, password and confirmation, learning background, study/work/interest area, learning goal, and optional age. The profile is validated and included in the Supabase signup metadata. Passwords are handled by Supabase Auth and are never included in the learning profile or saved learning state.

After the first verified sign-in, the API initializes the account's learning profile from those signup details, including when sign-in happens on another browser. This uses the existing atomic save functions. It never replaces an edited profile or recreates a profile the learner intentionally cleared. The header button changes to **Profile** in the same position. Profile details, editing or completing a profile, and **Logout** use that same dialog. **Edit details** in the signed-in welcome banner opens its edit view too. Cancelling edits does not save them; clearing a learning profile keeps the account and learning progress. Logout hides the profile and returns the header to Login without opening another popup. Guest learning remains available.

Under **Authentication → URL Configuration**, set **Site URL** to the live production URL `https://codeforge-lab.vercel.app`. Add these redirect URLs:

```text
http://localhost:3000/auth/**
https://codeforge-lab.vercel.app/auth/**
```

For confirmation and recovery links that also work when opened in another browser, use these links in **Authentication → Email Templates**. Keep Site URL set to the live site for production. These links verify a token hash on the server rather than relying on browser-local PKCE state:

Confirm signup:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email">Confirm your email</a>
```

Reset password:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery">Reset your password</a>
```

The confirm route verifies the token; recovery opens `/auth/reset-password`. Redirect targets are restricted to the app's home and reset-password pages. Expired links show a recovery page. The default Supabase templates also work through `/auth/callback` with PKCE, but the emailed link must open in the same browser that requested it.

Before students register with their own email addresses, configure **Authentication → SMTP Settings** using an email provider's sender address, host, port, username, and password. Supabase's built-in sender only delivers to project-team addresses and has low testing limits. Keep SMTP credentials in Supabase; they are not frontend environment variables. See [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

If email confirmation works but Profile shows empty fields or account sync fails, check that the SQL migration in step 2 has been run. Supabase Auth can store signup metadata before the learning tables exist. `/api/auth/session` returns the verified account's validated signup profile so the form can prefill while learning storage is unavailable. `/api/learning` persists and retrieves the account's editable profile in `learning_state.state.profile` once the migration is applied. The profile dialog shows a connection error and disables saving until storage recovers; use **Retry connection** after running the SQL. Saved edits and deliberate profile removal take precedence over signup metadata.

## 4. Run and check the app

Coding-day activity, active practice seconds, best streaks, and earned trophy IDs are saved inside `learning_state.state.activity` through the same account API and atomic save functions. No additional SQL migration is needed. Existing dated answers, quizzes, and completed daily exercises can recover older practice dates; missing historical minutes are not estimated. Guest activity transfers once when the learner signs in. Profile editing or clearing never removes the coding journey. The activity calendar follows the browser's local date, and the practice clock stops for hidden or unfocused tabs and after 60 seconds without editor interaction. A browser-local lease prevents simultaneous tabs from counting the same practice time; when device storage is blocked, the clock does not record time.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. Without Supabase settings, lessons still work as guest learning and the sign-in dialog explains that account sign-in is unavailable. With settings present, create and confirm a student account, sign in, practice a lesson, bookmark a topic, edit a code draft, and reload. Sign into the same account in a second browser to confirm that the name, profile, progress, bookmarks, code draft, and **Continue learning** destination restore. A different account must not see its saved data. Try password recovery and sign-out too.

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

Sources: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Vercel Marketplace integration](https://supabase.com/docs/guides/integrations/vercel-marketplace), [Supabase Next.js authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route).

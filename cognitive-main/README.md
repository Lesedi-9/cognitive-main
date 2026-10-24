# CognitiveAdapt

A behavioural adaptive-learning system for higher education. It watches how a student
answers - response latency, hesitation, answer changes, error patterns - estimates their
cognitive load in real time, and adapts difficulty and scaffolding accordingly. Administrators
get a research portal with live telemetry, account management and CSV/JSON exports.

## Run it locally (2 minutes)

You need [Node.js 18.18+](https://nodejs.org) (LTS is fine).

| OS | Command |
|----|---------|
| Windows | double-click **`start.bat`** |
| macOS / Linux | `./start.sh` |
| Any | `npm install` then `npm run dev` |

The app opens at **http://localhost:3000**. Use `localhost` (not a network IP): the browser's
crypto API, used for password hashing, only works in a secure context.

### Two modes - chosen automatically

| | **Local mode** (default, zero setup) | **Cloud mode** (Supabase) |
|---|---|---|
| Needs | nothing | a Supabase project + `.env` keys |
| Accounts | stored in this browser, passwords salted + PBKDF2-hashed (310k iterations) | Supabase Auth |
| First admin | the **first account you create** becomes administrator | promote one account with one SQL line |
| Data | this device only | shared, synced, protected by row-level security |

The navbar badge shows which mode is active.

## Connect Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env` and fill in **Project URL** and the **anon public** key
   (Dashboard → Project Settings → API). Never use the `service_role` key here.
3. Dashboard → SQL Editor → paste and run [`supabase/schema.sql`](supabase/schema.sql).
4. Restart `npm run dev`, register in the app, then make yourself admin:
   ```sql
   update public.profiles set role = 'admin' where lower(email) = lower('you@example.com');
   ```
5. In *Authentication → Providers → Email*, turn off **Confirm email** if you want instant
   sign-in during development (otherwise users must click the emailed link first).

The **Supabase Database Hub** tab in the admin portal shows live connection and schema health.

> Upgrading from an older version? Earlier builds stored plaintext passwords in a public
> `users` table. After running `schema.sql`, run [`supabase/drop_legacy_tables.sql`](supabase/drop_legacy_tables.sql)
> to delete it, and ask existing users to register again.

## Student experience

- **Level, XP and ranks** - every session earns XP for participation, accuracy, speed, working without hints and flawless runs.
- **Daily streaks** and **14 achievements** (Flawless, Lightning Recall, Comeback Kid, Know Thyself...).
- **Live cognitive-load meter** while a question is on screen: a gauge driven by elapsed time vs the expected time, hesitations and hint use, with a plain-language tip.
- **Confidence calibration** - rate how sure you are before submitting; the app shows how well your certainty matches your results (a core metacognition skill).
- **Cognitive Fingerprint** radar (Speed, Accuracy, Composure, Calibration, Resilience) with a learner archetype.
- **Personal insights** generated from your own behaviour: when you peak, whether hints help, speed vs accuracy, load trend, weakest concept.
- **Memory Vault** - spaced repetition (Leitner boxes: 1, 3, 7, 14, 30 days). Missed questions come back first; one click runs a review round.
- **60-second breathing reset** offered after two heavy questions in a row.
- **Session report** with XP breakdown, newly unlocked badges and a per-question timeline against expected time.
- **Keyboard shortcuts**: 1-4 choose, Enter submit/continue, H hint.

All of it is derived from your session history, so it works offline and follows you across devices in cloud mode.

## Security model

- **Password policy** (enforced on sign-up, reset and recovery; regex in `src/services/validation.ts`):
  8-64 characters, upper + lower case, a digit, a special character, no spaces, no character
  repeated 3+ times, not a common password, must not contain your name or email.
- Passwords are never stored or displayed in plain text; admins cannot see them.
- Nobody can self-register as admin. Roles are assigned server-side (cloud) or by creation order (local).
- Row-level security: students read/write only their own sessions and telemetry; only admins see everyone.
  A trigger blocks role escalation through the API.
- Sign-in has a client-side throttle (5 failures → 30 s lockout) and uses one generic error message.
  Supabase adds its own server-side rate limiting.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | dev server on :3000 |
| `npm run build` / `npm run preview` | production build / serve it locally |
| `npm run lint` | TypeScript type-check |
| `npm test` | unit tests for validation and progress analytics |

## Project layout

```
src/
  components/      AuthModal, HomePage, StudentDashboard, AdminPortal, Navbar, Logo
  services/
    auth.ts        sign-up / sign-in / recovery, picks cloud vs local backend
    supabase.ts    client, health probe, row mapping, sync
    validation.ts  email / name / password rules
    storage.ts     local cache, curriculum, exports
    adaptiveEngine.ts  cognitive-load heuristics
supabase/          schema.sql, drop_legacy_tables.sql
tests/             validation tests
```

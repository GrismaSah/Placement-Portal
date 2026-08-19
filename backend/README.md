# Backend — JAIN Placement Portal API

Express + MongoDB REST API. See the [root README](../README.md) for the full project overview and architecture.

## Setup

```bash
npm install
cp ../.env.example .env   # fill in real values
npm run dev                # nodemon, http://localhost:4000
```

Environment variables are documented in the root [`.env.example`](../.env.example) — copy it here as `.env`, nothing is re-listed below.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm start` | Start plain (production) |
| `npm run seed` | Seed demo accounts + jobs + enrollment allowlist |
| `npm run seed:accounts` | Just the demo Student/Recruiter/Admin accounts |
| `npm run seed:jobs` | Just the demo job listings |
| `npm run seed:allowlist` | Just the enrollment-number roster |

Recruiter and Admin sign-in is self-service: submitting the correct password with no verification code mints and sends a fresh one, so a login never gets permanently stuck. **With no SMTP configured the code is printed to the server console** — read it from the terminal rather than re-seeding.

The seeder sets a fixed code of `123456` on the demo Recruiter and Admin. That is a convenience for local demos only; because a correct code alone establishes a session, **never run the seeders against a deployed database.**

## Routes

All mounted under `/api/v1/`:

| Prefix | Handles |
|---|---|
| `/user` | Student + Recruiter register, login, profile |
| `/admin` | Placement office login, recruiter approvals, analytics, student directory |
| `/job` | Post, edit, delete, list, search jobs |
| `/application` | Apply, review applicants, advance pipeline status |
| `/resume` | Upload/download resumes (GridFS) |
| `/notification` | In-app notification feed |

## Notes

- **Two account collections.** Students and Recruiters live in `users`; the placement office lives in a separate `admins` collection. Auth middleware checks both, since one JWT format is shared across all three roles.
- **Resumes live in GridFS**, not on disk.
- **`server.js` is the app's entrypoint.** It's the only place Socket.IO can run (a long-lived process), so live in-app notifications only work when running this file.

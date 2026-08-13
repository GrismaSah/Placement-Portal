# JAIN Placement Portal

The official placement portal for JAIN (Deemed-to-be University), Bengaluru — connecting students, recruiters, and the Training & Placement Office in one place.

## Overview

Students browse and apply to job openings, recruiters post roles and review applicants, and the placement office approves recruiters and tracks outcomes. A student can only register with a JAIN enrollment number and matching college email; a recruiter can only post jobs once approved by the placement office.

## Roles

| Role | Who | Can do |
|---|---|---|
| **Student** | JAIN students, gated by an enrollment allowlist | Browse openings, apply, track application status, manage resume |
| **Recruiter** | Companies hiring on campus | Post/edit job openings, review applicants, move candidates through the pipeline |
| **Admin** | Placement office staff | Approve/decline recruiters, view placement analytics, browse the student directory |

Application pipeline: `Applied → Shortlisted → Interview → Offered → Placed`, with `Rejected`/`Withdrawn` reachable from any stage.

## Architecture

Two independent apps in one repository. In local dev they run side by side; in production they're built and served as a single Vercel project.

![Architecture — how the pieces fit together](docs/architecture.png)

- **Frontend** — React 18 + Vite dev server locally; static build served by Vercel in production.
- **Backend** — Express REST API. `server.js` runs it as a long-lived process locally, which is also what Socket.IO needs to work. In production, `backend/app.js` is instead loaded through `api/index.js` as a single Vercel serverless function — Socket.IO does not run there.
- **Database** — MongoDB Atlas, single database `JAIN_PLACEMENT`, three account-bearing collections (`users` for Students/Recruiters, `admins` for the placement office, plus a `studentallowlists` roster of valid enrollment numbers).
- **File storage** — resumes live in MongoDB GridFS, not on disk.
- **Auth** — JWT in an httpOnly cookie, one token format shared across all three roles; middleware resolves which collection (`users` vs `admins`) a token belongs to.

### Project structure

```
placement-portal/
├── backend/              # Express API — see backend/README.md
├── frontend/             # React + Vite client
├── docs/
│   └── architecture.png  # the diagram above
├── .env.example          # env var template — copy into backend/.env
└── package.json          # workspace-root convenience scripts only
```

### Backend module layout

```
backend/
├── server.js                # local dev entrypoint (Express + Socket.IO)
├── app.js                   # Express app, middleware, route mounting
├── routes/                  # one file per resource (user, admin, job, application, resume, notification)
├── controllers/             # request handlers — all business logic lives here
├── models/                  # Mongoose schemas
├── middlewares/             # auth, error handling, rate limiting
├── utils/                   # email sending, GridFS helpers, JWT helpers
├── config/                  # env access, branding constants
├── database/                # Mongo connection setup
├── data/                    # seed data (student enrollment allowlist CSV)
├── seed.js                  # demo account seeding (idempotent)
├── seedJobs.js              # demo job listings
└── seedStudentAllowlist.js  # demo enrollment-number roster
```

### Frontend module layout

```
frontend/src/
├── components/
│   ├── Auth/          # login, register
│   ├── Dashboard/     # per-role dashboard (Student / Recruiter / Officer)
│   ├── Job/           # job listing, posting, editing
│   ├── Application/   # applicant review, resume viewer
│   ├── Officer/       # recruiter approvals, student directory, analytics
│   ├── Profile/       # account settings
│   └── ui/            # shared design-system primitives
├── lib/               # api client, role helpers, react-query-style data hook
└── App.jsx            # routing, role-gated route guards
```

## Getting started

Requires Node 18+ and a MongoDB Atlas connection string.

```bash
git clone https://github.com/GrismaSah/Placement-Portal.git
cd placement-portal
npm --prefix backend install
npm --prefix frontend install

cp .env.example backend/.env   # then fill in real values
npm run seed                    # creates demo Student/Recruiter/Admin accounts + jobs
npm run dev                     # starts the backend on :4000
npm run dev:frontend            # in a second terminal, starts the frontend on :5173
```

Ports are fixed — the frontend hardcodes `http://localhost:4000` for API calls, so the backend must run on `4000` and the frontend on `5173`.

Recruiter and Admin logins require a fresh emailed verification code every sign-in; with no SMTP configured, use the fixed seed code from `npm run seed` instead of requesting a new one.

## API surface

All routes are mounted under `/api/v1/`:

| Prefix | Handles |
|---|---|
| `/user` | Student + Recruiter register/login/profile |
| `/admin` | Placement office register/login, recruiter approvals, analytics, student directory |
| `/job` | Job CRUD, listing, search |
| `/application` | Apply to a job, review applicants, status transitions |
| `/resume` | Resume upload/download via GridFS |
| `/notification` | In-app notification feed |

## Deployment

Live at **[jainplacements.vercel.app](https://jainplacements.vercel.app)**.

Deployed as a single Vercel project:

- **Frontend** — React 18 + Vite, built to static assets and served directly.
- **Backend** — the Express app (`backend/app.js`) runs as one Vercel serverless function via `api/index.js`; `/api/:path*` rewrites to it, everything else falls back to `index.html` for client-side routing.
- **Database** — the same MongoDB Atlas cluster used locally.
- **Socket.IO** — disabled in production; serverless functions can't hold a persistent WebSocket connection, so live in-app notifications only work in local dev (`server.js`).

For local development, see [Getting started](#getting-started) above.

# JAIN Placement Portal — Frontend

The React client for the JAIN Placement Portal: a campus placement system where students apply
to openings, recruiters review applicants, and the placement office approves recruiters and
tracks outcomes.

This is one half of the repository. See the [root README](../README.md) for architecture, the
API surface, and deployment.

## Roles

The same app serves three roles, gated by route guards in `App.jsx`:

| Role | Who | Sees |
|---|---|---|
| **Student** | JAIN students, gated by an enrollment allowlist | Openings, application tracker, resume builder |
| **Recruiter** | Companies hiring on campus | Their postings, applicant pipeline |
| **Admin** | Placement office staff | Recruiter approvals, student directory, placement analytics |

Application pipeline: `Applied → Shortlisted → Interview → Offered → Placed`, with
`Rejected`/`Withdrawn` reachable from any stage.

## Stack

- **React 18** with **Vite 5** (`@vitejs/plugin-react-swc` for Fast Refresh)
- **React Router 6** — routing and role-gated guards
- **Tailwind CSS 4** via `@tailwindcss/vite`, with design tokens in `src/styles/theme.css`
- **axios** for the API client, **socket.io-client** for live profile/resume sync
- **react-hot-toast** for notifications, **react-icons** for iconography
- No component library — the UI primitives in `src/components/ui/` are hand-built so the portal
  can match the university's own visual identity.

## Running locally

The frontend needs the API running first. From the repository root:

```bash
npm --prefix backend run dev     # API on http://localhost:4000
```

Then, in this directory:

```bash
npm install
npm run dev                      # http://localhost:5173
```

### Environment

No `.env` is required for local development — both variables have working defaults.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` in dev; same-origin in production | Point a local frontend at a deployed API |
| `VITE_ENABLE_SOCKETS` | on in dev, off otherwise | Socket.IO needs a long-lived server, which the serverless production deployment cannot provide |

Both are resolved in [`src/lib/api.js`](src/lib/api.js) and [`src/socket.js`](src/socket.js).

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server with HMR on 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run lint` | ESLint over `js,jsx`; fails on any warning |

## Structure

```
src/
├── components/
│   ├── Auth/           # login, register, verification, password reset
│   ├── Landing/        # public marketing page
│   ├── Dashboard/      # per-role dashboards
│   ├── Job/            # listings, detail, posting and editing
│   ├── Application/    # apply wizard, applicant review, resume viewer
│   ├── Officer/        # recruiter approvals, student directory, analytics
│   ├── Profile/        # account settings and resume builder
│   ├── Notifications/  # notification bell and feed
│   ├── Layout/         # app shell, sidebar, footer, page headers
│   ├── routing/        # ProtectedRoute, RoleRoute, PublicOnlyRoute
│   ├── ui/             # shared primitives (Button, Card, Table, Modal…)
│   └── DesignSystem/   # internal showcase of those primitives
├── lib/
│   ├── api.js          # axios instance and error extraction
│   ├── useQuery.js     # small stale-while-revalidate data hook
│   ├── roles.js        # role predicates and per-role navigation
│   └── theme.js        # light/dark handling
├── constants/
│   └── brand.js        # all university naming, colours and contact details
└── App.jsx             # routes and role gating
```

Two conventions worth knowing before editing:

- **Nothing about the university is hardcoded in JSX.** All naming, colours and contact details
  come from `src/constants/brand.js`. The portal was adapted from a base built for a different
  institution, and that branding had leaked into several files — this module exists so it cannot
  happen again.
- **`useQuery` is deliberately hand-written** rather than a dependency. It is about a hundred
  lines and provides the four things this app needed: caching, request de-duplication,
  stale-while-revalidate, and a first-load-only loading flag.

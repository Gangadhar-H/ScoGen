# SentinelGRC — Frontend

Enterprise-grade React frontend for the SentinelGRC Policy Exception Lifecycle
Management platform. Built to pair with the `socgen-backend` Express + Prisma +
PostgreSQL API.

No Redux, no UI component libraries (MUI/Chakra/Bootstrap), no Axios — plain
fetch, Context API, and Tailwind, by design, for a fast 2-person hackathon build.

---

## 1. Tech Stack

| Layer     | Choice                                                                |
| --------- | --------------------------------------------------------------------- |
| Framework | React 18 + Vite                                                       |
| Routing   | React Router v6                                                       |
| State     | Context API (`AuthContext`, `NotifContext`) — no Redux                |
| Styling   | Tailwind CSS                                                          |
| Charts    | Recharts                                                              |
| Icons     | lucide-react                                                          |
| HTTP      | native `fetch` via a single wrapper in `src/api/client.js` — no Axios |

---

## 2. Folder Structure

```
sentinel-frontend/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── src/
│   ├── main.jsx                     # React entrypoint
│   ├── App.jsx                      # Providers + route map
│   ├── api/                         # One module per backend resource
│   │   ├── client.js                #   centralized fetch wrapper (JWT inject, 401 handling, JSON parse)
│   │   ├── auth.js
│   │   ├── exceptions.js
│   │   ├── approvals.js
│   │   ├── audit.js
│   │   ├── reports.js
│   │   ├── notifications.js
│   │   ├── admin.js
│   │   └── lookups.js
│   ├── context/
│   │   ├── AuthContext.jsx          # user, login, logout, hasRole(), session persistence
│   │   └── NotifContext.jsx         # unread notification count, polling every 30s
│   ├── hooks/
│   │   └── useFetch.js              # generic load/error/loading hook
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx        # Sidebar + Topbar + content shell
│   │   │   ├── Sidebar.jsx          # role-aware nav items, collapsible
│   │   │   ├── Topbar.jsx           # page title, notification bell, user menu
│   │   │   └── ProtectedRoute.jsx   # auth + role gate
│   │   ├── ui/
│   │   │   ├── Button.jsx, Card.jsx, Badge.jsx, Modal.jsx, Table.jsx, Form.jsx
│   │   ├── charts/
│   │   │   └── Charts.jsx           # RiskDistribution, StatusOverview, DepartmentRisk, ComplianceImpact
│   │   ├── exceptions/              # (reserved — logic currently inline in pages)
│   │   └── notifications/           # (reserved — logic currently inline in pages)
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ExceptionsPage.jsx
│   │   ├── ExceptionDetailPage.jsx
│   │   ├── ExceptionFormPage.jsx
│   │   ├── ApprovalsPage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── AuditLogsPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   └── AdminPage.jsx
│   ├── utils/
│   │   └── format.js                # dates, RISK_COLORS, STATUS_COLORS, ROLE_LABELS
│   └── styles/
│       └── globals.css              # Tailwind directives + design-token utility classes
```

---

## 3. Prerequisites

- Node.js 18+
- The `socgen-backend` running locally (see its own README), with Postgres
  migrated and seeded.

---

## 4. Setup & Run

```bash
# 1. Install dependencies
cd sentinel-frontend
npm install

# 2. Start the backend first (separate terminal)
cd ../socgen-backend
npm install
cp .env.example .env        # set DATABASE_URL
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev                 # backend now on http://localhost:3000

# 3. Start the frontend
cd ../sentinel-frontend
npm run dev                 # frontend on http://localhost:5173 (Vite default)
```

`vite.config.js` proxies all `/api/*` requests to `http://localhost:3000`, so
the frontend never needs a `.env` of its own — just make sure the backend is
running on port 3000 (or update the proxy target if you changed `PORT`).

### Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

---

## 5. Demo Accounts

All seeded with password `password123`:

| Email                  | Role              |
| ---------------------- | ----------------- |
| admin@socgen.local     | Admin             |
| requester@socgen.local | Requester         |
| manager@socgen.local   | Approver          |
| security@socgen.local  | Security Reviewer |
| auditor@socgen.local   | Auditor           |

The login screen has one-click buttons that autofill these for you.

---

## 6. Authentication Flow

1. `LoginPage` calls `authApi.login(email, password)` → backend returns
   `{ id, email, name, role, departmentId, token }`.
2. `AuthContext` stores the token in `localStorage.sentinel_token` and the
   full user object in `localStorage.sentinel_user`, persisting the session
   across refreshes.
3. Every subsequent API call (`api/client.js`) reads the token and attaches
   `Authorization: Bearer <token>`.
4. A `401` response anywhere clears storage and hard-redirects to `/login`.
5. `ProtectedRoute` blocks unauthenticated users and shows an "Access
   Restricted" panel (inside the normal app shell) if the user's role isn't
   in the route's allowed list.

---

## 7. Role → Route Map

| Role              | Routes visible                                                          |
| ----------------- | ----------------------------------------------------------------------- |
| Requester         | Dashboard, My Exceptions, New Request, Notifications                    |
| Approver          | Dashboard, Approval Queue, Exceptions, Notifications                    |
| Security Reviewer | Dashboard, Review Queue, Exceptions, Reports, Audit Logs, Notifications |
| Auditor           | Dashboard, Exceptions (read-only), Reports, Audit Logs, Notifications   |
| Admin             | Everything, plus Administration                                         |

Route-level guards live in `App.jsx`; nav-level visibility lives in
`Sidebar.jsx`'s `NAV_ITEMS` map — both must agree with the backend's
`requireRole(...)` middleware per route.

---

## 8. API Layer Conventions

- `src/api/client.js` is the **only** place that calls `fetch`. Every
  resource module (`exceptions.js`, `approvals.js`, etc.) is a thin object of
  named methods that call `api.get/post/put/delete`.
- No endpoint in any `api/*.js` file was invented — each maps 1:1 to a route
  documented in the backend README (`/api/exceptions`, `/api/approvals`,
  `/api/reports/*`, `/api/audit-logs`, `/api/notifications`, `/api/admin/*`,
  `/api/lookups/*`).
- Query params (status, departmentId, page, limit, action, dates, framework)
  are passed straight through as a plain object to `api.get(path, params)`.

---

## 9. Known Limitations (intentional, hackathon scope)

- **Search**: the Exceptions list search box filters client-side over only
  the currently loaded page (no `?search=` param exists on the backend yet).
- **`components/exceptions/` and `components/notifications/`**: left empty
  on purpose — that UI logic lives directly inside the relevant pages
  instead of being extracted into shared components, since each is only used
  once.
- No PDF export, no WebSocket/live push (notifications poll every 30s), no
  email sending (backend mocks emails to console) — all explicitly out of
  scope per the backend's own README.

---

## 10. Completion Status

All required modules from the original spec are implemented and connected to
real backend endpoints: Auth, Dashboard, Exceptions, Approvals, Security
Review actions (override risk, emergency revoke), Auditor read-only views,
Admin (users/roles/policies/metrics), Reports, Notifications, and Audit Logs.
The app is runnable end-to-end against the seeded backend with no placeholder
data or TODOs.

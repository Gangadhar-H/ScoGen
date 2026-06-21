# SentinelGRC

**GRC Process Exception & Policy Waiver Management Platform**

Built for the **Société Générale Global Solution Centre Hackathon** — _Policy Governance & Risk Management_ track.

![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=flat-square)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=flat-square)
![Postgres](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Prisma-336791?style=flat-square)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Role → Access Map](#role--access-map)
- [Risk Engine](#risk-engine)
- [Automated Anomaly Detection](#automated-anomaly-detection)
- [API Reference](#api-reference)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Overview

Enterprises run on 100+ security and compliance policies — and in practice, day-to-day operations deviate from them constantly. Admin access gets granted "temporarily," firewall ports get opened for a vendor integration, a new hire gets early access before background checks finish. Each of these is a **policy exception**, and exceptions are exactly where governance breaks down: tracked in email threads, forgotten after approval, never formally revoked.

**SentinelGRC** replaces that chaos with a single governed system of record — every exception is captured, risk-scored, routed through a segregation-of-duties approval chain, continuously monitored for anomalies, and fully auditable end-to-end.

## The Problem

> _30% of security breaches exploit exceptions to policy. Are you managing risk, or creating it?_

Documented real-world failures that motivated this build:

- An exception granted "temporarily" for a network change was still active **three years later** — and led directly to a breach.
- **15 security exceptions** sat pending review for 3–6 months, with no one able to confirm which were still valid.
- Policy mandated "all vendor access requires approval," yet **5 vendors** held completely undocumented exceptions.

This maps to real compliance exposure — **NIST SP 800-53 (AC-2)**, **GDPR Article 25**, and **CIS Controls 1.1** all require consistently enforced, fully inventoried access controls.

Beyond the core feature list, we treated the following as first-class design requirements rather than edge cases:

- Is an exception still valid, or has it quietly gone stale?
- What happens when multiple approvers reach conflicting decisions?
- Emergency exceptions need strict, non-negotiable time limits.
- Exceptions should escalate _before_ they expire, not after.
- Risk accumulation — does one person holding ten "small" exceptions add up to one major risk?

## Our Solution

SentinelGRC is a full-stack policy exception lifecycle management platform:

- **React/Vite** frontend, secured with JWT and a 5-role RBAC model
- **Node.js/Express + PostgreSQL/Prisma** backend implementing the full exception lifecycle
- A **deterministic, explainable risk engine** — no black-box scoring
- A **Gemini-powered Governance Advisor** that proposes safer alternatives, with a fail-soft fallback so the AI is never a dependency for core functionality
- An **hourly anomaly detection engine** (8 rules) and a **Governance Credit Score** that turns abstract risk into an auditor-friendly A–F grade
- An **immutable, replayable audit trail** with full before/after state on every action

| Ambiguity from the brief                     | How SentinelGRC resolves it                                                                                                                          |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is the exception still valid?                | Cron jobs flag any `ACTIVE` exception past its expiry (`EXPIRED_BUT_ACTIVE`) and anything running 180+ days without re-review (`LONG_RUNNING`).      |
| Conflicting approver decisions               | Strict two-stage, sequential approval (Manager → Security Reviewer). No approver can act on their own request; every decision is permanently logged. |
| Emergency exceptions need strict time limits | Start/expiry dates are mandatory before submission. A daily scheduler force-expires anything overdue — nothing stays active by accident.             |
| Escalate before expiry                       | Automated 7-day / 3-day / overdue notifications, plus an "Expiring Soon" dashboard metric.                                                           |
| Risk accumulation                            | `MULTIPLE_PER_USER` flags 3+ simultaneous exceptions per requester; `REPEATED_EXCEPTION` flags repeated requests for the same system.                |

## Key Features

**Security & Governance**

- Five-role segregation-of-duties RBAC (Requester, Approver, Security Reviewer, Auditor, Admin), enforced at route, UI, and middleware level
- Two-stage sequential approval workflow with mandatory, justified risk-score overrides
- Deterministic, fully explainable risk scoring engine
- AI Governance Advisor (Gemini) with automatic fail-soft fallback — never blocks exception creation
- 8-rule automated anomaly detection engine, run hourly via cron
- Organization & department-level Governance Credit Score (A–F grading)
- Immutable, fully replayable audit trail with PDF export
- Compliance framework mapping (NIST SP 800-53, GDPR, ISO 27001)
- Automated lifecycle enforcement — expiry, renewal re-approval, escalation notifications

**Platform**

- Executive dashboard with risk distribution, department, and compliance-impact charts
- Reports module: Active / Critical / Expired / By Department / Compliance / Policy Effectiveness / Governance Score
- In-app + email notifications (with console-mock fallback when SMTP isn't configured)
- Admin console for users, roles, departments, policies, and exception types
- One-click demo accounts for instant role switching
- Live, in-form risk-score preview while drafting a request

## Architecture

```
┌──────────────────────┐        HTTPS / JWT        ┌──────────────────────────┐
│   sentinel-frontend   │  ───────────────────────▶ │      socgen-backend      │
│  React + Vite + RR6   │ ◀───────────────────────  │  Express + Prisma + PG   │
│  Tailwind + Recharts  │        REST (/api/*)       │  JWT · RBAC · node-cron  │
└──────────────────────┘                            └────────────┬─────────────┘
                                                                   │
                                       ┌───────────────────────────┼───────────────────────────┐
                                       ▼                           ▼                           ▼
                              ┌──────────────┐          ┌──────────────────┐         ┌──────────────────┐
                              │  PostgreSQL  │          │  Google Gemini    │         │  Nodemailer /     │
                              │  (Prisma)    │          │  Governance       │         │  console fallback │
                              └──────────────┘          │  Advisor          │         └──────────────────┘
                                                         └──────────────────┘
```

**Exception lifecycle**

```
DRAFT → SUBMITTED → MANAGER_APPROVED → ACTIVE → EXPIRED
                  ↘ REJECTED              ↘ REVOKED
                  ↘ INFO_REQUESTED (returns to DRAFT on edit)

ACTIVE → renew → SUBMITTED (re-enters the full approval workflow, renewalCount++)
```

## Tech Stack

| Layer               | Technology                                                                          |
| ------------------- | ----------------------------------------------------------------------------------- |
| Frontend            | React 18 + Vite, React Router v6, Context API, Tailwind CSS, Recharts, lucide-react |
| Backend             | Node.js + Express                                                                   |
| Database / ORM      | PostgreSQL + Prisma                                                                 |
| Authentication      | JWT (bearer tokens), bcrypt password hashing                                        |
| AI Advisory Layer   | Google Gemini (`gemini-2.0-flash`), deterministic fail-soft fallback                |
| Scheduled Jobs      | node-cron — expiry checks, notification cadence, hourly anomaly detection           |
| Document Generation | PDFKit — audit log & report exports                                                 |
| Email Delivery      | Nodemailer (console-mock fallback in development)                                   |

## Project Structure

```
.
├── sentinel-frontend/        # React + Vite SPA
│   ├── src/
│   │   ├── api/               # one module per backend resource (client.js wraps fetch)
│   │   ├── context/            # AuthContext, NotifContext
│   │   ├── components/         # layout, ui, charts, exceptions
│   │   ├── pages/               # Dashboard, Exceptions, Approvals, Reports, Audit Logs, Admin...
│   │   └── utils/                # formatting helpers
│   └── README.md              # full frontend setup guide
│
└── socgen-backend/            # Express + Prisma + PostgreSQL API
    ├── prisma/
    │   ├── schema.prisma        # data model
    │   ├── seed.js               # demo users, departments, exceptions
    │   └── seedBulkExceptions.js # ~100 additional exceptions for anomaly/governance demos
    ├── src/
    │   ├── controllers/           # business logic per resource
    │   ├── routes/                  # Express routers
    │   ├── middleware/               # auth, RBAC, error handling
    │   ├── services/                  # notifications, Gemini advisor
    │   ├── utils/                      # risk engine, anomaly detector, governance scoring, PDF generation
    │   └── schedulers/                  # node-cron jobs
    └── README.md               # full backend setup guide + API reference
```

## Getting Started

> Detailed, step-by-step instructions for each app — including environment variables and the complete API reference — live in their own README files:
> **[`sentinel-frontend/README.md`](./sentinel-frontend/README.md)** and **[`socgen-backend/README.md`](./socgen-backend/README.md)**.
> The quick start below gets both apps running locally in under five minutes.

### Prerequisites

- Node.js 18+
- A local or remote PostgreSQL instance
- (Optional) A Google Gemini API key, for the AI Governance Advisor — the app runs fine without one, the advisor simply stays disabled

### 1. Clone the repository

```bash
git clone <repo-url>
cd <repo-folder>
```

### 2. Backend setup

```bash
cd socgen-backend
npm install

cp .env.example .env
# edit .env -> set DATABASE_URL to your local Postgres instance,
# and optionally GEMINI_API_KEY for the AI advisor

npx prisma generate
npx prisma db push      # creates tables from prisma/schema.prisma
npm run db:seed         # demo users, departments, exception types, policies
npm run db:seed:bulk     # optional — adds ~100 extra exceptions for a richer demo

npm run dev              # backend now running on http://localhost:3000
```

### 3. Frontend setup

```bash
cd ../sentinel-frontend
npm install
npm run dev               # frontend now running on http://localhost:5173
```

The frontend's Vite dev server proxies all `/api/*` requests to `http://localhost:3000`, so no frontend `.env` is required — just make sure the backend is running first.

### 4. Log in

Open `http://localhost:5173` and use any of the [demo accounts](#demo-accounts) below — the login screen has one-click buttons that autofill them for you.

## Demo Accounts

All demo accounts share the password **`password123`**:

| Email                    | Role              |
| ------------------------ | ----------------- |
| `admin@socgen.local`     | Admin             |
| `requester@socgen.local` | Requester         |
| `manager@socgen.local`   | Approver          |
| `security@socgen.local`  | Security Reviewer |
| `auditor@socgen.local`   | Auditor           |

## Role → Access Map

| Role              | Routes visible                                                          |
| ----------------- | ----------------------------------------------------------------------- |
| Requester         | Dashboard, My Exceptions, New Request, Notifications                    |
| Approver          | Dashboard, Approval Queue, Exceptions, Notifications                    |
| Security Reviewer | Dashboard, Review Queue, Exceptions, Reports, Audit Logs, Notifications |
| Auditor           | Dashboard, Exceptions (read-only), Reports, Audit Logs, Notifications   |
| Admin             | Everything, plus Administration                                         |

## Risk Engine

```
finalScore = typeRisk + durationRisk + renewalRisk − approvalBonus   (clamped 0–100)

typeRisk:      Admin Access 50 · Firewall 30 · Encryption Waiver 70 · Data Access 60 · Dev Env 10
durationRisk:  ≤30d +10 · ≤90d +25 · ≤180d +40 · >180d +50
renewalRisk:   1st +5 · 2nd +10 · 3rd+ +15
approvalBonus: manager −2 · security −5  (max −10)
riskLevel:     0–25 LOW · 26–50 MEDIUM · 51–75 HIGH · 76–100 CRITICAL
```

A Security Reviewer may pass an `overrideRiskScore` on final approval, with a required `overrideReason` — every override is logged.

## Automated Anomaly Detection

Run hourly via `node-cron`, persisted, and surfaced on the dashboard:

1. **EXPIRED_BUT_ACTIVE** — `ACTIVE` but past `expiryDate` _(critical)_
2. **STALLED_REVIEW** — `SUBMITTED` for 30+ days
3. **LONG_RUNNING** — `ACTIVE` for 180+ days
4. **MULTIPLE_PER_USER** — requester holds 3+ simultaneous `ACTIVE` exceptions
5. **EXCESSIVE_RENEWALS** — renewed 3+ times
6. **REPEATED_EXCEPTION** — same type/department/system requested 3+ times
7. **HIGH_RISK_LONG_EXCEPTION** — `HIGH` risk, active 180+ days without re-review
8. **CRITICAL_RISK_EXCEPTION** — `CRITICAL` risk while `ACTIVE` _(critical)_

These same flags feed the per-department **Governance Credit Score** (0–100, graded A–F).

## API Reference

The full endpoint reference, including request/response shapes and a curl-based end-to-end walkthrough, is documented in **[`socgen-backend/README.md`](./socgen-backend/README.md)**. Summary of resource groups:

| Group         | Base path            | Notes                                                                                                                      |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Auth          | `/api/auth`          | register, login, me                                                                                                        |
| Exceptions    | `/api/exceptions`    | create, list, get, update, delete, submit, renew, revoke                                                                   |
| Approvals     | `/api/approvals`     | list, approve, reject, request-info                                                                                        |
| Reports       | `/api/reports`       | dashboard, active/expired/critical, department-wise, compliance-impact, policy-effectiveness, governance-score, PDF export |
| Audit Logs    | `/api/audit-logs`    | list, per-exception timeline, PDF export                                                                                   |
| Notifications | `/api/notifications` | list, mark read / mark all read, delete                                                                                    |
| Admin         | `/api/admin`         | users, exception types, policies, system metrics                                                                           |
| Lookups       | `/api/lookups`       | departments, exception types, policies, compliance frameworks                                                              |
| Advisor       | `/api/advisor`       | AI-powered suggestion endpoint                                                                                             |

## Known Limitations

Intentional hackathon-scope cuts, documented for transparency:

- Exceptions list search filters client-side over the currently loaded page only (no `?search=` param on the backend yet)
- No WebSocket/live push — notifications poll every 30 seconds
- Real email sending requires SMTP configuration; without it, emails are mocked to the console
- No automated test suite yet (manual end-to-end verification via the documented curl walkthrough)

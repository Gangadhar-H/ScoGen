# SocGen — Policy Exception Management Backend (Hackathon MVP)

Express + Prisma + PostgreSQL backend implementing the exception lifecycle, risk
scoring, anomaly detection, approvals, audit trail, notifications, and reports
described in the design docs.

**Note on stack:** built in plain JavaScript (not TypeScript) on purpose — same
Express/Prisma/Postgres/JWT/node-cron stack from the blueprint, but no build step
to fight with mid-hackathon. `npm install && npm run dev` and you're live.

## 1. Setup (5 minutes)

```bash
cd socgen-backend
npm install

cp .env.example .env
# edit .env -> set DATABASE_URL to your local Postgres instance

npx prisma generate
npx prisma db push      # creates tables from prisma/schema.prisma
npm run db:seed         # demo users, departments, exception types, policies

npm run dev             # starts on http://localhost:3000
```

## 2. Demo accounts (password for all: `password123`)

| Email | Role |
|---|---|
| admin@socgen.local | ADMIN |
| requester@socgen.local | REQUESTER |
| manager@socgen.local | APPROVER |
| security@socgen.local | SECURITY_REVIEWER |
| auditor@socgen.local | AUDITOR |

## 3. Exception lifecycle

```
DRAFT → SUBMITTED → MANAGER_APPROVED → ACTIVE → EXPIRED
                  ↘ REJECTED              ↘ REVOKED
                  ↘ INFO_REQUESTED (back to DRAFT on edit)

ACTIVE → renew → SUBMITTED (goes through the workflow again, renewalCount++)
```

Two approval stages: a pending `Approval` row (role `MANAGER`) is created on
submit; once a manager approves, a second `Approval` row (role
`SECURITY_REVIEWER`) is created and the security reviewer's approval activates
the exception.

## 4. Try it end-to-end

```bash
# Login as requester
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"requester@socgen.local","password":"password123"}'
# -> copy the "token" field

TOKEN="<paste token here>"

# Look up reference data for the create-exception form
curl http://localhost:3000/api/lookups/exception-types -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/api/lookups/departments -H "Authorization: Bearer $TOKEN"

# Create an exception
curl -X POST http://localhost:3000/api/exceptions \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "title":"Firewall rule for vendor API",
    "businessJustification":"Need outbound access to partner API",
    "systemAffected":"Production API Gateway",
    "exceptionTypeId":"<id from exception-types lookup>",
    "departmentId":"<id from departments lookup>",
    "startDate":"2026-06-20",
    "expiryDate":"2026-07-20"
  }'

# Submit it (use the id returned above)
curl -X POST http://localhost:3000/api/exceptions/<id>/submit -H "Authorization: Bearer $TOKEN"

# Login as manager@socgen.local, approve
curl -X POST http://localhost:3000/api/approvals/<id>/approve \
  -H "Authorization: Bearer $MANAGER_TOKEN" -H "Content-Type: application/json" \
  -d '{"comments":"looks fine"}'

# Login as security@socgen.local, approve -> exception goes ACTIVE
curl -X POST http://localhost:3000/api/approvals/<id>/approve \
  -H "Authorization: Bearer $SECURITY_TOKEN" -H "Content-Type: application/json" \
  -d '{"comments":"approved"}'
```

## 5. Endpoint reference

### Auth (public)
- `POST /api/auth/register` — self-registers as REQUESTER
- `POST /api/auth/login`
- `GET /api/auth/me`

### Exceptions
- `POST /api/exceptions` — create (REQUESTER, ADMIN)
- `GET /api/exceptions` — list, scoped by role (`?status=&departmentId=&page=&limit=`)
- `GET /api/exceptions/:id`
- `PUT /api/exceptions/:id` — owner only, while DRAFT/INFO_REQUESTED
- `DELETE /api/exceptions/:id` — owner only, while DRAFT
- `POST /api/exceptions/:id/submit`
- `POST /api/exceptions/:id/renew` — must be ACTIVE
- `POST /api/exceptions/:id/revoke` — owner, or SECURITY_REVIEWER/ADMIN (emergency)

### Approvals
- `GET /api/approvals` — pending queue for the caller's role
- `POST /api/approvals/:exceptionId/approve` — body: `{ comments, overrideRiskScore?, overrideReason? }` (override is security-reviewer only)
- `POST /api/approvals/:exceptionId/reject` — body: `{ reason }`
- `POST /api/approvals/:exceptionId/request-info` — body: `{ message }`

### Reports (SECURITY_REVIEWER / AUDITOR / ADMIN, dashboard also APPROVER)
- `GET /api/reports/active-exceptions`
- `GET /api/reports/expired-exceptions`
- `GET /api/reports/critical-exceptions`
- `GET /api/reports/department-wise`
- `GET /api/reports/compliance-impact?framework=NIST`
- `GET /api/reports/dashboard`

### Audit logs (SECURITY_REVIEWER / AUDITOR / ADMIN)
- `GET /api/audit-logs` — `?user=&action=&resource=&startDate=&endDate=&page=`
- `GET /api/audit-logs/:exceptionId` — full timeline for one exception

### Notifications (any authenticated user)
- `GET /api/notifications?isRead=false`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/mark-all-read`
- `DELETE /api/notifications/:id`

### Admin (ADMIN only)
- `GET/POST /api/admin/users`, `PUT /api/admin/users/:id`
- `POST /api/admin/exception-types`
- `POST /api/admin/policies`
- `GET /api/admin/metrics`

### Lookups (any authenticated user — for frontend dropdowns)
- `GET /api/lookups/departments`
- `GET /api/lookups/exception-types`
- `GET /api/lookups/policies`
- `GET /api/lookups/compliance-frameworks`

## 6. Risk engine

```
finalScore = typeRisk + durationRisk + renewalRisk - approvalBonus   (clamped 0-100)

typeRisk:      Admin Access 50, Firewall 30, Encryption Waiver 70, Data Access 60, Dev Env 10
durationRisk:  ≤30d +10, ≤90d +25, ≤180d +40, >180d +50
renewalRisk:   1st +5, 2nd +10, 3rd+ +15
approvalBonus: manager -2, security -5 (max -10)
riskLevel:     0-25 LOW, 26-50 MEDIUM, 51-75 HIGH, 76-100 CRITICAL
```
A security reviewer can pass `overrideRiskScore` on approval to set the score manually.

## 7. Anomaly detection (5 rules, run hourly + on-demand via `/api/reports/dashboard`)

1. **EXPIRED_BUT_ACTIVE** — ACTIVE but past expiryDate (CRITICAL)
2. **STALLED_REVIEW** — SUBMITTED for >30 days (WARNING)
3. **LONG_RUNNING** — ACTIVE duration >180 days (WARNING)
4. **MULTIPLE_PER_USER** — requester has 3+ simultaneous ACTIVE exceptions (WARNING)
5. **EXCESSIVE_RENEWALS** — renewed 3+ times (WARNING)

## 8. Schedulers (node-cron)
- Daily 00:00 UTC — expire ACTIVE exceptions past `expiryDate`
- Daily 06:00 UTC — send 7-day / 3-day / overdue notifications
- Hourly — re-run anomaly detection, notify security reviewers of CRITICAL flags

## 9. What's intentionally out of scope (per the design doc's MVP cut list)
PDF export, policy-effectiveness analytics, "repeated exception" AI/NLP detection,
Redis caching, WebSocket push, real email sending (mocked to console).

## 10. Next steps if you have extra time
- Wire `npx prisma migrate dev` instead of `db push` once the schema stabilizes (keeps migration history)
- Add Jest + Supertest for the lifecycle and risk-engine logic
- Swap the console-log email mock for Nodemailer

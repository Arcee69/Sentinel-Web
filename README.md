# SMHP Sentinel Connect — Agent PWA

Installable field-operations app for Sentinel agents: see the tasks the admin
assigned you, file reports against them, file election-day returns, and flag
incidents with photo and video evidence — including while offline.

Companion to the [Sentinel back office](https://sentinel-backoffice.netlify.app/),
which is where agent accounts and tasks are created. **There is no sign-up** —
administrators add agents.

## Quick start

```bash
npm install
cp .env.example .env   # points at https://smhpsentinel.com/api/v1
npm run dev
```

Sign in with a seeded demo agent (password `Smhpsentinel@2026!`):

| Agent | Email | Area | Polling unit codes |
| --- | --- | --- | --- |
| Alpha agent A | `agent-a@alpha.sentinel-demo.example.test` | Lagos State | `DEMO-A-001`, `DEMO-A-002` |
| Alpha agent B | `agent-b@alpha.sentinel-demo.example.test` | Kano State | `DEMO-B-001`, `DEMO-B-002` |
| Beta agent | `agent@beta.sentinel-demo.example.test` | Kano State | `DEMO-B-001`, `DEMO-B-002` |

Managers, observers and admins are turned away at sign-in — they have no field
assignment and belong in the back office. Repeated sign-ins are rate limited
(429); the form shows the wait time.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the build (needed to exercise the service worker) |
| `npm run lint` | ESLint |

## API integration

One Sentinel API serves this app and the back office; the reference is
`frontend-integration-guide.md` and the Postman collection. Every response is
`{ success, message, data, meta }`; errors are
`{ success: false, message, error: { code, details }, request_id }` and are
normalised to `ApiError` in [`errors.ts`](src/services/errors.ts).

- **Session.** `POST /auth/login` (`email`, `password`, `device_name`) returns a
  bearer token, then `GET /auth/context` decides the workspace: the first
  campaign with `access.can_work`, preferring one with an active assignment
  ([`resolveWorkspace`](src/services/agentService.ts)). Context is re-read
  whenever the API is reachable; the stored snapshot keeps the app usable
  offline. A 401 clears the session and returns to `/login?expired=1`.
- **Mapping.** [`agentService.ts`](src/services/agentService.ts) is the only file
  that knows API shapes. It turns snake_case records and enum codes into the
  display types in [`types.ts`](src/lib/types.ts); label↔code tables live in
  [`constants.ts`](src/lib/constants.ts).

| Screen | Calls |
| --- | --- |
| Home | `/auth/context`, `/campaigns/{c}/tasks`, `/campaigns/{c}/notifications`, `/staff-notifications/{n}/read` |
| Tasks | `/campaigns/{c}/tasks`, `/tasks/{t}`, `/tasks/{t}/start`, `/tasks/{t}/complete` (with `expected_revision`) |
| Task report | `POST /campaigns/{c}/field-reports` (`activity_type: task_note`), then `/media/uploads` |
| Election | `/campaigns/{c}/polling-reports`, `/campaigns/{c}/polling-places?code=`, `POST /polling-places/{p}/reports` (+ `Idempotency-Key`), `/polling-occasions` when a code matches several elections |
| Incidents | `/campaigns/{c}/incidents` GET/POST, then `/media/uploads` |
| Profile | context snapshot, `PATCH /auth/notification-preferences`, `/auth/logout` |
| Password | `/auth/password/forgot`, `/auth/password/reset` (link lands on `/reset-password?token=&email=`) |
| Presence | `POST /assignments/{a}/heartbeat` every 5 minutes while visible and online |

### Submissions and evidence

Reports are created first; each photo or video is then uploaded on its own to
`POST /media/uploads` (`parent_type`, `parent_id`, `file`). Accepted formats are
JPEG/PNG/MP4/WebM/MOV, and the picker only offers those. If an attachment fails
after the record exists, the remaining files are queued as a separate evidence
job, so the record is never refiled. Uploaded evidence may stay pending while
the server scans it.

Ticking **Mark task complete** on a report form calls `/complete` after the
submission lands (starting the task first if needed). It re-reads the task
first, in case the server already closed it.

### API limits worth knowing

- Report and incident lists carry polling-unit **IDs**, not codes, and an agent
  can't look a unit up by ID. The app remembers codes it has seen on this device
  ([`places.ts`](src/lib/places.ts)); records filed elsewhere show without a unit.
- Tasks only carry a `geographic_unit_id`; the app can name the agent's home
  unit (from context) and falls back to it otherwise.
- There is no campaign switcher yet — an agent working several campaigns gets
  the one with an active assignment.

## Domain model

- **Task** — `category` (`Opinion Poll` · `Election Report` · `Incident Report`,
  or none), `subject`, `priority`, `status` (`Pending` · `In Progress` ·
  `Completed` · `Cancelled`), `revision`. Category routes **Submit report** to
  the matching form.
- **Election report** — a polling-unit return: `subject` (the five election
  subjects), `operating_status` (`Open` · `Delayed` · `Not opened` · `Closed` ·
  `Suspended`), accredited persons, votes cast, notes, and a `review_state` from
  the collation desk. Recorded against a **polling place**, not a ward.
- **Incident** — one of six `incident_type`s, `severity`, the polling-unit code
  as typed, optional GPS, `status` (`Open` · `Escalated` · `Resolved`). The API
  derives the broad category itself.

## Offline behaviour

Agents work through dead zones, so offline is a first-class path rather than an
error state.

- Submissions made offline — or interrupted by a dropped connection — are
  written to an **IndexedDB outbox** ([`outbox.ts`](src/lib/outbox.ts)) with
  their exact body, `client_submission_id` and idempotency key, and replayed
  oldest-first on reconnect and on tab focus. A queued record is never shown as
  delivered.
- An election report queued offline keeps the typed code; it is resolved to a
  polling place when the queue syncs.
- A submission the server rejects (validation, permission, conflict) stops
  retrying and is listed on **Profile** with the server's reason, to retry or
  discard. Network and server errors retry up to five times.
- Captured photos and video are stored as blobs in IndexedDB
  ([`media.ts`](src/lib/media.ts)) until the server has them.
- React Query runs with `networkMode: "always"` — this app owns its own offline
  semantics, and the default would otherwise pause writes indefinitely instead of
  letting them reach the outbox.

## PWA

Hand-rolled, no plugin. [`public/sw.js`](public/sw.js) is network-first for
navigations (falling back to the cached shell), cache-first for hashed assets, and
deliberately never caches API calls — stale field data would mislead an agent.
Manifest, icons and shortcuts are in [`public/`](public/).

The service worker is disabled in dev; use `npm run build && npm run preview` to
test install and offline launch.

## Structure

```
src/
  components/    UI primitives, MediaPicker, NoticeBoard, StatusStrip, TaskCard, BottomNav
  context/       auth / offline / theme — hooks in .ts, providers in .tsx
  hooks/         tasks query, submission flow, assignment heartbeat
  layout/        PhoneFrame, AuthLayout, AppLayout
  lib/           types, constants, formatting, IndexedDB, outbox, media, places
  pages/         auth · home · tasks · elections · incidents · profile
  routers/       route table and the protected/public gates
  services/      endpoints, axios instance, session, errors, agentService
```

## Notes

- Typography is DM Sans for text and headings, JetBrains Mono for the tactical
  labels and telemetry readouts. Colours are hex tokens defined once on `:root`
  and `.dark` in [`index.css`](src/index.css) — every component reads them
  through Tailwind, so a rebrand is an edit to those two blocks. The light/dark
  toggle lives in Profile.

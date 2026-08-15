# SMHP Sentinel Connect — Agent PWA

Installable field-operations app for Sentinel agents: see the tasks the admin
assigned you, file reports against them, and flag incidents with photo and video
evidence — including while offline.

Companion to the [Sentinel back office](https://sentinel-backoffice.netlify.app/),
which is where agent accounts and tasks are created. **There is no sign-up** —
administrators add agents.

## Quick start

```bash
npm install
npm run dev
```

Sign in with a seeded demo agent:

| Field | Value |
| --- | --- |
| Email | `test@sentinel.com` |
| Password | `password` |

The forgot-password flow accepts reset code **`123456`**.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the build (needed to exercise the service worker) |
| `npm run lint` | ESLint |

While the mock backend is active, the **API Simulator** (flask button, above the
bottom nav) lets you demo slow connections, server errors, expired sessions and
dropped signal — see below.

## Backend wiring — how this behaves once the API is live

There is no backend yet, so requests are answered locally. Crucially they are
**not** short-circuited: the mock is installed as an *axios adapter*
([`mockAdapter.ts`](src/services/mock/mockAdapter.ts)), so every call still runs
through the real interceptors, carries the real `Authorization` header, uploads
real multipart bodies, and comes back as a real `AxiosResponse` or `AxiosError`.

[`agentService.ts`](src/services/agentService.ts) therefore contains **no mock
branch** — what runs today is the production code path. Going live is one flag:

```bash
# .env
VITE_API_BASE_URL=https://api.sentinel.example/v1
VITE_USE_MOCK_API=false
```

### The API Simulator

While the mock is active, a flask button sits above the bottom nav. It drives the
adapter so you can see how each screen behaves against a real server:

| Control | Demonstrates |
| --- | --- |
| Connection profile | Good signal · Rural 3G · Flaky · No service |
| Latency | Loading skeletons and spinners under a slow API |
| Failure rate | Error states with a working **Retry** |
| Server unreachable | Transport-level failure and the offline outbox |
| Expire my session | A `401` → token cleared → redirect to `/login?expired=1` |
| Reset demo data | Restores the seeded tasks, reports and incidents |

The button turns amber whenever conditions are degraded, so a demo never
silently runs in a broken state. It disappears entirely once
`VITE_USE_MOCK_API=false`.

### Contract the backend must implement

Every response uses one envelope:

```jsonc
// success
{ "success": true, "data": { /* payload */ } }
// failure — `message` is shown to the agent verbatim
{ "success": false, "message": "That code isn't right." }
```

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/auth/login` | `identifier`, `password` | `{ token, agent, issuedAt }` |
| POST | `/auth/logout` | — | `{ ok }` |
| POST | `/auth/forgot-password` | `identifier` | `{ hint }` (masked contact) |
| POST | `/auth/verify-reset-code` | `identifier`, `code` | `{ ok }` |
| POST | `/auth/reset-password` | `identifier`, `code`, `password` | `{ ok }` |
| GET | `/agent/tasks` | — | `Task[]` for the bearer's agent |
| GET | `/agent/tasks/:id` | — | `Task` |
| PATCH | `/agent/tasks/:id/status` | `status` | updated `Task` |
| GET | `/agent/reports` | — | `TaskReport[]` |
| POST | `/agent/reports` | multipart | created `TaskReport` |
| GET | `/agent/incidents` | — | `Incident[]` |
| POST | `/agent/incidents` | multipart | created `Incident` |

Notes for whoever builds this:

- **Auth** is `Authorization: Bearer <token>`. Any `401` on an `/agent/*` route
  signs the agent out; a `401` on `/auth/login` is treated as bad credentials and
  shown inline instead.
- **The token identifies the agent.** `/agent/*` routes must scope to the bearer
  rather than trusting an id from the client.
- **Submissions are multipart.** Text fields plus a `mediaMeta` JSON array
  (`id`, `kind`, `name`, `size`, `mimeType`, `duration`) and repeated `media`
  file parts. Respond with the stored records, including the URLs your storage
  assigned — the client's local blob URLs are meaningless to anyone else.
- **Validation failures** should use `422` with a human `message`; it is rendered
  straight to the agent.
- Status codes are honoured throughout: `403` and `404` produce distinct copy —
  see `errorMessage()` in [`instance.ts`](src/services/instance.ts).

## Domain model

Types in [`src/lib/types.ts`](src/lib/types.ts) mirror the back office field-for-field,
so an agent's submission needs no translation on the way in. Renaming a field here
means renaming it in the admin too.

- **Task** — `category` (`Opinion Poll` · `Election Report` · `Incident Report`),
  `subject` (from that category's fixed list), `priority`, `status`
  (`Pending` · `In Progress` · `Completed`), `assigneeId`, `state`, `lga`, `due`.
- **Report** — `type` (`Rally` · `Door-to-Door` · `Town Hall` · `Media` ·
  `Distribution`), `body`, `respondents`, `media`, `location`.
- **Incident** — `type` (`Violence` · `Delay` · `Malpractice` · `Logistics`),
  `severity`, `unit` (polling unit code), `status` (`Open` · `Escalated` ·
  `Resolved`), `media`, optional GPS fix.

The category → subject lists and the subject → incident-type mapping are in
[`src/lib/constants.ts`](src/lib/constants.ts). Critical incidents are filed as
`Escalated` rather than `Open`.

## Offline behaviour

Agents work through dead zones, so offline is a first-class path rather than an
error state.

- Submissions made offline are written to an **IndexedDB outbox**
  ([`src/lib/outbox.ts`](src/lib/outbox.ts)) and replayed oldest-first when the
  connection returns, on reconnect and on tab focus. Five failed attempts retires
  an item.
- Captured photos and video are stored as blobs in IndexedDB
  ([`src/lib/media.ts`](src/lib/media.ts)), so evidence survives a reload while a
  report sits queued.
- The console strip shows GPS lock, connection state, queue depth (tap to sync
  now) and battery.
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
  components/    UI primitives, MediaPicker, StatusStrip, TaskCard, BottomNav
  context/       auth / offline / theme — hooks in .ts, providers in .tsx
  layout/        PhoneFrame, AuthLayout, AppLayout
  lib/           types, constants, formatting, IndexedDB, outbox, media
  pages/         auth · home · tasks · incidents · profile
  routers/       route table and the protected/public gates
  services/      API facade, axios instance, mock adapter + simulator
```

## Notes

- Typography is DM Sans for text and headings, JetBrains Mono for the tactical
  labels and telemetry readouts. Colours are hex tokens defined once on `:root`
  and `.dark` in [`index.css`](src/index.css) — every component reads them
  through Tailwind, so a rebrand is an edit to those two blocks. The light/dark
  toggle lives in Profile.
- The seeded database persists in `localStorage` under `sentinel.mockdb.v2`.
  Bump the key in [`mockDb.ts`](src/services/mock/mockDb.ts) whenever the seed
  changes, or existing browsers will keep serving the old copy.

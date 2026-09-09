# Lost & Found — Frontend

An Angular Material web app for the [Lost & Found API](../lost-and-found) —
browse and claim lost items, or (as an admin) import found items and see
who's claimed what.

This is a separate project from the backend on purpose: different toolchain
(Node/Angular vs Maven/Spring), different lifecycle. See the backend repo
for the actual assignment; this is the frontend built on top of it.

## Running it

The backend must already be running on `http://localhost:8081` (see its own
README). Then:

```bash
npm install
npm start
```

The app opens on `http://localhost:4200`. In dev, `ng serve` proxies every
`/api/**` request straight through to the backend (see `proxy.conf.json`),
so the browser only ever talks to one origin and CORS never comes up.

Log in with any of the seed accounts (same as the backend):

| Username | Password | Role |
|---|---|---|
| `alice`, `brian`, `carla` | `password123` | USER |
| `admin` | `password123` | ADMIN |

```bash
npm test    # unit tests (Vitest)
```

## What's here

- **Login** — JWT auth against `POST /api/auth/login`.
- **Browse** — list, fuzzy keyword search, and natural-language query, with
  a claim dialog (quantity bounded by what's actually left).
- **Admin: Import** — drag-and-drop upload for `.txt`/`.csv` files.
- **Admin: Claims report** — every item and who's claimed it.

Admin screens are hidden and route-guarded for non-admin accounts.

## Design

The visual design (colors, typography, card/button shapes) is adapted from
an AI-generated mockup (Google Stitch), applied as a custom Material 3
theme in `src/styles.scss`. The mockup also invented some things the real
API doesn't have — item photos, categories, a multi-step "verify before
claiming" flow, an editable import preview — those were left out. What you
see here reflects what the backend can actually do.

## Known simplifications (and what production would add)

- **Dev-only CORS workaround.** The `ng serve` proxy only works for local
  development. Deploying this frontend on its own domain would need the
  backend to add real CORS configuration, or a reverse proxy in front of
  both.
- **JWT stored in `localStorage`, no refresh flow.** Fine for a 1-hour demo
  token; a real app would want httpOnly cookies and refresh tokens.
- **The admin route guard is UI convenience only.** It just hides pages a
  non-admin can't use anyway — the backend's `role` check (403) is the real
  enforcement, and this app never trusts the client-side check for
  anything security-sensitive.
- **No end-to-end tests.** Unit tests cover the auth/HTTP core (interceptors,
  guards, services, claim-quantity bounds); full-page rendering and E2E
  flows aren't covered, which is proportionate for a demo of this size but
  wouldn't be for production.

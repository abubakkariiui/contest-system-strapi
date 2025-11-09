# Contest Participation System

Full-stack contest platform composed of a Strapi v5 backend and a React + Vite frontend. The system lets users register, join contests, submit answers, view leaderboards, and track their participation history with role-based access control.

## Screenshots
<img width="1917" height="986" alt="image" src="https://github.com/user-attachments/assets/e9ca7566-0086-4ed9-8866-16b304d4684a" />
<img width="1920" height="988" alt="screencapture-localhost-5173-contests-2025-11-09-12_55_54" src="https://github.com/user-attachments/assets/8478d20f-5e4b-49f1-b7a3-ada5b1f456c3" />
<img width="1919" height="986" alt="image" src="https://github.com/user-attachments/assets/0de3bce3-6c95-434b-aa26-567f94b6ce8e" />
<img width="1919" height="992" alt="image" src="https://github.com/user-attachments/assets/235ab5ac-2f5f-45ec-a59a-307721df0766" />


## Features

- Role-aware access: Admin and VIP users can see VIP contests; normal users see only normal contests; guests can browse but must sign in to participate.
- Contest workflow: Join contests, answer single-select, multi-select, and true/false questions, submit once, and receive immediate scoring feedback.
- Leaderboard & prizes: Submissions rank by score (then submission time). All highest scorers receive the configured prize flag.
- User history: Dedicated endpoints and UI sections for in-progress contests, completed history, and prizes won.
- Security & hardening: authenticated APIs, in-memory rate limiting, and solution hiding for non-admin viewers.
- Tooling: Postman collection (`docs/contest-system.postman_collection.json`) covering authentication, contests, participation, and leaderboard flows.

## Project Structure

```
contest-system/
├── config/                # Strapi configuration (database, middleware, rate limiting, plugins)
├── src/                   # Strapi application code (content-types, controllers, services, utils)
├── docs/contest-system.postman_collection.json
├── frontend/              # React client (Vite)
└── types/generated/       # Strapi type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ (Strapi 5 supports up to Node 22.x).
- npm 8+.

### 1. Install dependencies

```bash
npm install          # install Strapi backend dependencies
cd frontend
npm install          # install React frontend dependencies
```

### 2. Configure environment variables

- Backend: copy `.env.example` to `.env` (already provided). Defaults use SQLite.
- Frontend: `frontend/.env` is pre-populated with `VITE_API_URL=http://localhost:1337`. Adjust if the backend runs elsewhere.

### 3. Run the stack locally

In separate terminals:

```bash
# Backend (Strapi)
npm run develop

# Frontend (React)
cd frontend
npm run dev
```

- Visit the Strapi admin UI at `http://localhost:1337/admin` to create an administrator account on first run.
- The React client runs at `http://localhost:5173` by default.

### Seed data & roles

Core data is bootstrapped automatically by `src/index.js`, and you can re-run the process at any time with:

```bash
npm run seed
```

The seeding step is idempotent. It ensures:

- Custom `normal` and `vip` roles (in addition to Strapi's `authenticated` and `public`).
- Permission assignments for all custom endpoints plus `/users/me`.
- Sample contests:
  - `General Knowledge Trivia` (normal access).
  - `VIP Championship` (VIP-only).
- Demo users and participations so the UI shows leaderboards, history, and prizes immediately.

#### Demo credentials

| Role   | Username         | Email                        | Password       |
|--------|------------------|------------------------------|----------------|
| Normal | `normal_player`  | `normal.player@example.com`  | `Password123!` |
| Normal | `casual_player`  | `casual.player@example.com`  | `Password123!` |
| VIP    | `vip_player`     | `vip.player@example.com`     | `Password123!` |
| VIP    | `vip_challenger` | `vip.challenger@example.com` | `Password123!` |

To promote another account to VIP, edit the user in the Strapi admin and assign the `vip` role.

## API Overview

All routes are prefixed with `/api`. Authenticated requests require an `Authorization: Bearer <JWT>` header.

| Method | Route                                   | Description                                | Auth Required |
|--------|-----------------------------------------|--------------------------------------------|---------------|
| POST   | `/auth/local`                           | Login                                       | No            |
| POST   | `/auth/local/register`                  | Register (defaults to `normal` role)       | No            |
| GET    | `/contests`                             | List contests filtered by caller role      | Optional      |
| GET    | `/contests/:id`                         | Contest detail with questions (no answers) | Optional      |
| POST   | `/contests/:id/join`                    | Join or resume a participation attempt     | Yes           |
| POST   | `/contests/:id/submit`                  | Submit answers                             | Yes           |
| GET    | `/contests/:id/leaderboard`             | Leaderboard for a contest                  | Yes           |
| GET    | `/me/contests/in-progress`              | User's in-progress participations          | Yes           |
| GET    | `/me/contests/history`                  | Completed participations with scores       | Yes           |
| GET    | `/me/prizes`                            | Prizes won                                 | Yes           |
| POST   | `/users/:id/role`                       | Update a user's role (`normal` or `vip`)   | Yes (Admin)   |

Detailed request/response examples are available in the Postman collection located in `docs/`.

## Frontend Highlights

- React Router provides navigation for contests, contest detail, history, in-progress lists, and prizes.
- Centralized auth context handles JWT storage, login/register flows, and user bootstrap.
- Contest detail page supports joining/resuming attempts, answering questions by type, submitting, viewing feedback, and loading the leaderboard.
- Responsive layout with utility classes defined in `frontend/src/index.css`.

## Rate Limiting

A custom middleware (`src/middlewares/rate-limit`) guards `/api/*` endpoints:

- Default window: 60 seconds.
- Max requests per window: 100 (configurable in `config/middlewares.js`).
- Identifies buckets by authenticated user ID or IP address; exceeding the quota returns HTTP 429 with retry metadata.

## Testing & Builds

- Backend: `npm run build` compiles the Strapi admin panel.
- Frontend: `npm run build` (inside `frontend/`) creates the production bundle under `frontend/dist/`.

## Notes & Limitations

- Prize awarding marks every submission that ties for the top score as a winner.
- Authentication is required for leaderboard access (mirrors backend policies).
- The rate limiter is in-memory; for distributed deployments replace it with a shared store (Redis, etc.).

## Documentation

- Postman: `docs/contest-system.postman_collection.json`
- README: this document

Feel free to extend the UI or adapt the backend APIs as needed for additional contest mechanics or reporting.

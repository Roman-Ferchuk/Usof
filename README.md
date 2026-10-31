# usof — questions and answers for developers

Full Stack track, challenge **usof frontend** (second part of the usof project).
A React + Redux single-page app on top of the **usof backend** REST API (Express + MySQL, folder `API/`).

## What it does
- Registration with e-mail confirmation, log in / log out, password reset.
- Main page with the latest posts; sorting (date / rating), filtering (category, date interval, status), search, pagination with a changeable page size. Every control lives in the URL, so a filtered list can be shared.
- Post page: images, likes/dislikes, nested comments (comments on comments), comments sorted by rating, favourites, e-mail subscription, view counter, reading time.
- Profile page: edit login / full name, upload an avatar, list of the user's posts with their own sorting and filters.
- **Statistics page** (`/#/stats`): totals, a 30-day activity chart (questions, comments, views), popular categories, like/dislike ratio, top members and most viewed questions. Charts are plain SVG, no chart library.
- **Admin panel inside the app** (`/#/admin`, admins only): overview with "needs attention" counters, users (roles, e-mail confirmation, delete), posts and comments (hide, lock, delete), categories (create, edit, delete), reactions. One login for the whole site.
- Sharing: native share sheet, copy link, Facebook, X, LinkedIn, Telegram.
- Light / dark theme with a toggle (remembers the choice), "/" focuses the search box, "Skip to content" link, responsive layout.
- Validation of every form with readable messages.

## Screenshots
Add your screenshots to `docs/screenshots/` and link them here:

| Page | File |
|------|------|
| Main page | `docs/screenshots/home.png` |
| Post with comments | `docs/screenshots/post.png` |
| Registration | `docs/screenshots/register.png` |
| Profile | `docs/screenshots/profile.png` |
| Admin panel | `docs/screenshots/admin.png` |

## Requirements
- Node.js 20.19+ (or 22.12+) and npm
- MySQL 8 (for the API); `API/docker-compose.yaml` starts one with `docker compose up -d`

## How to run
```bash
git clone <your-repository-url>
cd <repository>

# 1. API (port 3000)
cd API
cp .env.example .env      # then set JWT_SECRET (and the DB settings if they differ)
npm install && npm start
cd ..

# 2. Web app (port 5173)
npm install
npm run dev          # http://localhost:5173
```
The dev server proxies `/api`, `/uploads` and `/admin` to `http://localhost:3000`
(change it with `API_URL=http://host:port npm run dev`).
Production build: `npm run build` → `dist/`.

Test admin from the seed data: `admin_alex` / `Password123`. Without SMTP settings the confirmation and reset links are printed in the API console.

Never commit `API/.env`: it holds the JWT secret and the mail password (it is in `.gitignore`).

## Project structure
```
web/                 React app (index.html, src/)
  src/api/client.js  the only file that knows the API contract
  src/store/         Redux Toolkit slices: auth, feed, favorites, stats, ui
  src/components/    reusable UI pieces
  src/pages/         one component per route (pages/admin/ holds the admin tabs)
  src/router.jsx     small hash router (no third-party router)
API/                 usof backend (+ src/admin: the old stand-alone panel, optional)
```

## Algorithm of the program
1. `main.jsx` mounts `<App/>` inside the Redux `Provider`.
2. `App` restores the session from the JWT in `localStorage` (`restore`), loads categories and picks the page for the current `#/path`.
3. `Feed` reads filters from the URL, calls `fetchFeed` and renders `PostCard`s with `Pagination`; changing a control changes the URL, which triggers a new request.
4. `PostPage` loads the post and a flat list of comments; `Comments` builds a tree by `parentId` and sorts each level by rating.
5. Likes, favourites, locks and subscriptions are sent to the API and update only the affected component.
6. A `401` answer clears the token and sends the user to the login page.
7. `PostPage` counts one view per browser session (`POST /api/posts/:id/view`); `Stats` reads `GET /api/stats`; `Admin` renders the tab chosen in `?tab=` and loads it through `/api/admin/*`.

## Progress by CBL stage
- **Engage** — studied the brief: the client must visualise every endpoint of the backend.
- **Investigate** — compared SPA and multi-page apps, chose React + Redux, planned routes and slices, listed security measures (no `innerHTML`, validated forms, token cleared on 401).
- **Act: Basic** — header with search and user info, menu, main and profile pages, sorting, filtering, pagination, nested comments, validation, responsive layout.
- **Act: Creative** — statistics page with SVG charts and view counters, admin panel inside the app, favourites, e-mail subscription, locking, sharing buttons, footer, light/dark theme.
- **Document / Share** — this README; LinkedIn post tagged `#InnovationCampusKhPI`.

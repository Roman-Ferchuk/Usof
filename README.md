# usof — questions and answers for developers

Full Stack track, challenge **usof frontend** (second part of the usof project).
A React + Redux single-page app (Create React App) on top of the **usof backend** REST API (Express + MySQL, folder `API/`).

## What it does
- Registration with e-mail confirmation, log in / log out, password reset.
- Main page with the latest posts; sorting (date / rating), filtering (category, date interval, status), search, pagination with a changeable page size. Every control lives in the URL, so a filtered list can be shared.
- Post page: images, likes/dislikes, nested comments (comments on comments), comments sorted by rating, favourites, e-mail subscription, view counter, reading time.
- Profile page: edit login / full name, upload an avatar, list of the user's posts with their own sorting and filters.
- **Statistics page** (`/#/stats`): totals, a 30-day activity chart (questions, comments, views), popular categories, like/dislike ratio, top members and most viewed questions. Charts are plain SVG, no chart library.
- **Admin panel inside the app** (`/#/admin`, admins only): overview with "needs attention" counters, users (edit data, roles, e-mail confirmation, delete), posts (hide/show, lock, change categories, delete), comments (hide, lock, delete), categories (create, edit, delete), reactions. One login for the whole site. Hiding a post as an admin also locks it, so its author cannot simply show it again.
- **Photos** are added one by one (or several at once) with a preview and a remove button for each, up to 5 per post; they can also be added and removed when a post is edited.
- Authors can hide and show their own posts; the profile page has a change-password form.
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
- Node.js 18+ (20 or 22 recommended) and npm
- MySQL 8 (for the API); `API/docker-compose.yaml` starts one with `docker compose up -d`

## How to run
```bash
git clone <your-repository-url>
cd <repository>

# 1. API (port 3000)
cd API
npm install
npm start
cd ..

# 2. Web app (port 5173)
npm install
npm start            # http://localhost:5173  (`npm run dev` does the same)
```
The dev server proxies `/api`, `/uploads` and `/admin` to `http://localhost:3000`
(see `src/setupProxy.js`; another address: `API_URL=http://host:port npm start`).
The port 5173 is set in `.env.development` (the API builds e-mail links from `CLIENT_URL=http://localhost:5173`).
Production build: `npm run build` → `build/` (static files; the app uses a hash router, so any static host works).

Test admin from the seed data: `admin_alex` / `Password123`. Without SMTP settings the confirmation and reset links are printed in the API console.

Never commit `API/.env`: it holds the JWT secret and the mail password (it is in `.gitignore`).

## API notes for reviewers
All routes start with `/api`. Request bodies can be JSON or `application/x-www-form-urlencoded` (plain `curl -d`).

| Task | Request |
| --- | --- |
| Register | `POST /auth/register` (`login`, `email`, `password`, `passwordConfirmation`) |
| Change a password | `PATCH` or `PUT /users/:id` with `password` (optional `passwordConfirmation`, `currentPassword`) |
| Admin creates / deletes a user | `POST /users`, `DELETE /users/:id` |
| Hide a post (author or admin) | `PATCH /posts/:id` with `status=inactive` |
| Comment on a comment | `POST /comments/:id/reply` |
| Add photos to a post | `POST /posts/:id/images` (multipart field `images`, 5 per post) |
| Remove a photo | `DELETE /posts/:id/images/:image_id` |
| Statistics, view counter | `GET /stats`, `POST /posts/:id/view` |

Only an admin can delete other users' comments; authors can delete their own. Demo photos and avatars for the seed data live in `API/uploads/posts` and `API/uploads/avatars` and are committed on purpose; files uploaded at run time are ignored by git.

## Project structure
```
public/index.html      HTML template of the React app (Create React App)
src/                   React app
  index.js             entry point
  setupProxy.js        dev-server proxy to the API (/api, /uploads, /admin)
  api/client.js        the only file that knows the API contract
  store/               Redux Toolkit slices: auth, feed, favorites, stats, ui
  components/          reusable UI pieces
  pages/               one component per route (pages/admin/ holds the admin tabs)
  router.jsx           small hash router (no third-party router)
API/                   usof backend (+ src/admin: the old stand-alone panel, optional)
```

## Algorithm of the program
1. `index.js` mounts `<App/>` inside the Redux `Provider`.
2. `App` restores the session from the JWT in `localStorage` (`restore`), loads categories and picks the page for the current `#/path`.
3. `Feed` reads filters from the URL, calls `fetchFeed` and renders `PostCard`s with `Pagination`; changing a control changes the URL, which triggers a new request.
4. `PostPage` loads the post and a flat list of comments; `Comments` builds a tree by `parentId` and sorts each level by rating.
5. Likes, favourites, locks and subscriptions are sent to the API and update only the affected component.
6. A `401` answer clears the token and sends the user to the login page.
7. `PostPage` counts one view per browser session (`POST /api/posts/:id/view`); `Stats` reads `GET /api/stats`; `Admin` renders the tab chosen in `?tab=` and loads it through `/api/admin/*`.

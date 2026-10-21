# usof frontend

React + Redux interface for the **usof backend** API: questions, comments (nested), categories, reactions, profiles.

## Features
- Header (service name, search, role / login / avatar, logout) and menu bar on every page
- Home feed (newest first) with filters: category, sort field, order, page size; classic numbered pagination
- Post preview cards; full post page with nested comments sorted by likes (ascending by default, togglable)
- Reply to comments, edit / delete own posts and comments, like / dislike posts and comments
- Register, login, password reset; every form validates input with messages
- Profile page: edit personal data, change avatar, own posts with the same filters
- Share (copy link, Facebook, X), footer, responsive layout, light/dark theme

## Requirements
Node.js 18+, npm, running usof backend on `http://localhost:3000` (change in `web/vite.config.js`).

## Run
```bash
git clone <repo> && cd <repo>
# 1. start the backend from ./API (see its README)
# 2. frontend
cd web && npm install && npm run dev
```
Open http://localhost:5173.

## Architecture
```
src/
  api/client.js      all HTTP calls + response normalizers (only file that knows the backend contract)
  store/             Redux Toolkit: authSlice (user, token), feedSlice (posts list, categories)
  router.jsx         minimal hash router (no third-party router)
  components/        Header, Feed, PostCard, Comments (tree), Reactions, Pagination, Field, Avatar, Footer
  pages/             Home, PostPage, Editor, Profile, Login, Register, Reset
  config.js          default page size, page-size options, sort options
```
Algorithm: App restores the session from the JWT in localStorage -> router picks a page by URL hash ->
Feed reads filters from the URL query, dispatches `fetchFeed`, renders cards + pager -> post page loads
the post and a flat comment list, builds a tree by `parentId`, sorts every level by likes.

## CBL progress
- Engage: ... Investigate: ... Act: ... (fill in with your notes and screenshots)

## Routes
`/` feed · `/posts/:id` · `/new` · `/posts/:id/edit` · `/profile/:id` · `/favorites` · `/login` · `/register` ·
`/confirm/:token` (email confirmation) · `/reset`, `/reset/:token` (password reset) · `/admin` (categories, users, roles).
The links in the backend e-mails should point to `http://localhost:5173/#/confirm/<token>` and `http://localhost:5173/#/reset/<token>`.

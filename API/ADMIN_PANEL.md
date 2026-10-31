# usof Admin Panel

Opens at **http://localhost:3000/admin/** after `npm start`.
Test admin from the seed data: `admin_alex` / `Password123`.

## How it works

| Layer | Files |
|-------|-------|
| Client (plain JS, ES modules, no build step) | `src/admin/index.html`, `css/admin.css`, `js/*.js`, `js/views/*.js` |
| Panel server endpoints | `routes/adminRouter.js` → `controllers/AdminController.js` → `services/AdminService.js` → `repositories/AdminRepository.js` |
| Errors with HTTP status | `errors/HttpError.js` |

The panel is a static SPA served by Express under `/admin`. It talks to the same REST API as the other
clients (JWT in `Authorization: Bearer`). The token is stored in `sessionStorage` and disappears when the
tab is closed.

**Authentication.** The panel has no separate admin account. It signs in through the regular
`POST /api/auth/login` endpoint, so an admin uses the same login and password as on the frontend
(one row in the `users` table, role `admin`). After sign-in the panel checks `user.role === 'admin'`;
any other role is rejected on the login form.

**Access.** All data is protected on the server: `/api/admin/*` and the CRUD endpoints require a JWT with the
`admin` role (`authMiddleware` + `requireRole('admin')`). A regular user gets 403, and the panel itself
will not let them past the login form.

## Features

- **Authentication:** sign in, sign out, password reset (email → reset link).
- **Users:** list with search and filters, create user/admin, edit profile, change role, change password,
  confirm email, delete.
- **Posts:** all posts, including inactive ones; change categories, active/inactive status, lock, delete,
  create. Post content cannot be edited.
- **Categories:** create, view, edit, delete.
- **Comments:** view all, create, active/inactive status, lock, delete. Content cannot be edited.
- **Likes:** view all (by post, comment, author, type), add one reaction from the admin profile,
  delete any reaction.

## Admin endpoints (`/api/admin`, admin only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/stats` | counters and "needs attention" items |
| GET | `/users`, `/posts`, `/comments`, `/likes` | lists with search, filters and pagination (`page`, `limit ≤ 100`) |
| DELETE | `/likes/:like_id` | delete any like |
| PATCH | `/users/:user_id/password` | set a new password for a user |
| PATCH | `/users/:user_id/confirm-email` | confirm an email manually |

`GET /api/auth/password-reset/:token` is also available: it redirects to the new-password form in the panel.

---

> **Note.** The web app now has its own admin panel at `/#/admin` (React, same login as the site, same
> `/api/admin/*` endpoints). This stand-alone panel is optional and can be removed together with the
> `/admin` static mount in `src/app.js`.

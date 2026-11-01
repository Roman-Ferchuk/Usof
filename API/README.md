# usof — backend (API)

REST API for a developer Q&A platform (StackOverflow clone).  
Users can register, create posts with multiple categories and images, comment, and like/dislike content.  
Administrators manage all entities via the API and a built-in admin dashboard.

**Tech Stack:** JavaScript, Node.js, Express 5, MySQL 8 (in Docker), JWT, bcrypt, multer, nodemailer.  
**Architecture:** MVC + layered structure `routes → controllers → services → repositories → entities` (OOP with dependency injection via constructors).

---

## Requirements

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18+ (20 or 22 LTS recommended) | Server execution |
| npm | Bundled with Node.js | Dependency management |
| Docker Desktop | Any recent version | Running MySQL in a container |
| curl.exe | Built into Windows 10/11 | Testing API endpoints |

Required ports: **3000** (API) and **3306** (MySQL). If a local MySQL service is already running, stop it or change `"3306:3306"` to `"3307:3306"` in `docker-compose.yaml` and set `DB_PORT=3307` in `.env`.

---

## Getting Started (Clone to First Request)

Commands for PowerShell.

### 1. Clone the repository and enter the folder

```powershell
git clone <YOUR_REPOSITORY_URL>
cd <PROJECT_FOLDER>
```

### 2. Spin up the database

```powershell
docker compose up -d
```

The `db` container (MySQL 8.0) creates the `usof_database` database and the user `admin` / `admin`.  
**Initial startup takes 20–40 seconds.** Do not start the server until the database is ready:

```powershell
docker compose logs db --tail 5
```

Look for the log line `ready for connections` on `port: 3306`. It appears twice: the first instance is a temporary initialization server, and the second is the active server instance.

> The server does not retry database connections on startup. If launched too early, it will exit with `Failed to start server`. Simply wait a few seconds and run it again.

### 3. Install dependencies and start the application

```powershell
npm install
npm start
```

The console output should look similar to:

```
Database connected successfully
Database schema initialized successfully
Database seed initialized successfully
Server running on port 3000
Admin panel: http://localhost:3000/admin/
```

On first launch, the server automatically creates the database tables (`src/database/schema.sql`) and populates them with seed data (`src/database/seed.sql`). Seeding runs only if the `users` table is empty.

### 4. Make your first request

```powershell
curl.exe -i http://localhost:3000/api/posts
```

Expected response: `HTTP/1.1 200 OK` and a JSON array containing posts. Admin panel: <http://localhost:3000/admin/>.

---

## Test Accounts

Password for all accounts: **`Password123`**

| login | role | email confirmed | notes |
|-------|------|-----------------|-------|
| `admin_alex` | admin | yes | |
| `code_master` | user | yes | author of post 1 |
| `dev_girl` | user | yes | |
| `backend_guy` | user | yes | |
| `newbie_dev` | user | **no** | login fails until email is confirmed (intended behavior) |

---

## Database Management

```powershell
docker compose stop                 # Stop DB (data is persisted)
docker compose start                # Resume DB
docker compose down -v              # Destroy DB and remove all volume data
```

**Full fresh restart** (stop the server via `Ctrl+C` first):

```powershell
docker compose down -v
docker compose up -d
# wait 30 seconds, then:
npm start
```

Tables are created using `CREATE TABLE IF NOT EXISTS`, so existing data will not be overwritten without `down -v`.

Query table records directly:

```powershell
docker compose exec db mysql -uadmin -padmin usof_database -e "SELECT id, login, email, email_confirmed, role FROM users;"
```

---

## Project Structure

```
server.js                 Entry point, dependency assembly
src/app.js                Express app setup, middleware, route handling
src/routes/               API endpoint definitions
src/controllers/          HTTP layer (reads request, formats response)
src/services/             Business logic and validations
src/repositories/         SQL queries layer
src/entities/             Data models
src/middlewares/          Authentication (JWT), authorization, file upload, rate limiting
src/database/             schema.sql, seed.sql
src/admin/                Admin panel (static SPA)
uploads/                  Uploaded static assets (avatars, post images)
```

---

## API Summary

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/register`, `GET /api/auth/confirm-email/:token`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/password-reset`, `POST /api/auth/password-reset/:token` |
| Users | `GET /api/users` (admin), `GET /api/users/:id`, `POST /api/users` (admin), `PATCH /api/users/avatar`, `PATCH\|PUT /api/users/:id`, `PATCH /api/users/:id/role` (admin), `DELETE /api/users/:id` |
| Posts | `GET /api/posts`, `GET /api/posts/:id`, `GET\|POST /api/posts/:id/comments`, `GET /api/posts/:id/categories`, `GET\|POST\|DELETE /api/posts/:id/like`, `POST /api/posts`, `PATCH /api/posts/:id`, `PATCH /api/posts/:id/lock` (admin), `DELETE /api/posts/:id` |
| Categories | `GET /api/categories`, `GET /api/categories/:id`, `GET /api/categories/:id/posts`, `POST\|PATCH\|DELETE` (admin) |
| Comments | `GET\|PATCH\|DELETE /api/comments/:id`, `GET\|POST\|DELETE /api/comments/:id/like`, `PATCH /api/comments/:id/lock` (admin) |
| Admin | `/api/admin/stats`, `/users`, `/posts`, `/comments`, `/likes`, `DELETE /likes/:id`, `PATCH /users/:id/password`, `PATCH /users/:id/confirm-email` |
| Feature Extras | `/api/posts/:id/favorite`, `/api/users/favorites`, `/api/posts/:id/subscribe` |

Protected endpoints require an `Authorization: Bearer <token>` header. The token is obtained via `POST /api/auth/login`.

Sorting and filtering posts example: `GET /api/posts?sort=likes|date&order=asc|desc&categoryIds=1,2&dateFrom=2026-09-01&dateTo=2026-09-30&status=active|inactive&page=1&limit=10`.

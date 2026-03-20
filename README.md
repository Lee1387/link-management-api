# BranchlyAPI

BranchlyAPI is the backend for Branchly, a private link management product for creating, managing, and controlling short links through authenticated ownership and public redirects.

It is designed as a real product backend with clear module boundaries, pragmatic NestJS architecture, and production-minded defaults.

## Why BranchlyAPI Exists

BranchlyAPI exists to support a focused Branchly product experience:

- users can register and log in
- users can create and manage their own short links
- public visitors can resolve active short codes
- link lifecycle controls like disablement and re-enablement are enforced at the API level

It is intentionally opinionated:

- It is the backend for the Branchly product
- It is not being shaped as a generic public developer platform
- Production defaults are private-product oriented
- Browser access is expected to come from the Branchly frontend

## API Endpoints

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | No | Create a user account |
| `POST` | `/auth/login` | No | Authenticate and receive a bearer token |
| `POST` | `/links` | Yes | Create a short link |
| `GET` | `/links` | Yes | List owned links |
| `GET` | `/links/:id` | Yes | Get owned link details |
| `PATCH` | `/links/:id/disable` | Yes | Disable an owned link |
| `PATCH` | `/links/:id/enable` | Yes | Re-enable an owned link |
| `GET` | `/:shortCode` | No | Resolve a short code publicly |
| `GET` | `/health` | No | Liveness check |

Additional notes:

- `GET /links` supports `limit` and `offset`
- `GET /health/ready` is hidden in production
- Swagger docs are available outside production at `/docs`

## Architecture

BranchlyAPI uses a modular NestJS structure with clear boundaries between HTTP transport, application logic, and infrastructure:

- `src/auth` handles registration, login, JWT issuance, JWT verification, and request authentication
- `src/links` contains link creation, ownership-aware management flows, link lifecycle controls, and public redirect resolution
- `src/health` provides liveness and non-production readiness checks
- `src/config` owns environment validation and runtime configuration
- `src/prisma` contains database integration and Prisma service wiring
- `test` contains end-to-end and database-backed integration coverage

Within each feature area, controllers stay thin, use cases own application behavior, and Prisma repositories isolate persistence details.

## Stack

- NestJS
- Fastify
- Prisma
- PostgreSQL
- JWT auth
- Zod env validation
- Jest unit and e2e tests

## Example Requests

Register a user:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"alex@example.com\",\"password\":\"my-secure-password\"}"
```

Log in and receive an access token:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"alex@example.com\",\"password\":\"my-secure-password\"}"
```

Example login response:

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "user": {
    "id": "cm8f4b2zy0000s6m8x2v0q3lp",
    "email": "alex@example.com"
  }
}
```

Create a short link:

```bash
curl -X POST http://localhost:3000/links \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{\"originalUrl\":\"https://example.com/articles/clean-architecture\"}"
```

List owned links:

```bash
curl "http://localhost:3000/links?limit=25&offset=0" \
  -H "Authorization: Bearer <token>"
```

Disable a link:

```bash
curl -X PATCH http://localhost:3000/links/<linkId>/disable \
  -H "Authorization: Bearer <token>"
```

Re-enable a link:

```bash
curl -X PATCH http://localhost:3000/links/<linkId>/enable \
  -H "Authorization: Bearer <token>"
```

Resolve a short code publicly:

```bash
curl -i http://localhost:3000/<shortCode>
```

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and adjust values if needed.

Key variables:

- `PORT`
- `DATABASE_URL`
- `FRONTEND_ORIGIN`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

### 3. Start Postgres and apply migrations

```bash
pnpm db:setup
```

### 4. Start the API

```bash
pnpm start:dev
```

The API runs on `http://localhost:3000` by default.

## Testing

BranchlyAPI has both unit tests and database-backed e2e coverage.

- `pnpm test` runs the unit test suite
- `pnpm test:e2e` starts Postgres, applies migrations, and runs end-to-end tests
- `pnpm lint` checks code quality and formatting rules
- `pnpm build` verifies the Nest application compiles cleanly

Useful commands:

```bash
pnpm start:dev
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm db:up
pnpm db:down
pnpm prisma:migrate:dev
```

## Environment

Example local environment:

```env
NODE_ENV=development
PORT=3000
POSTGRES_DB=branchly_api
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/branchly_api?schema=public
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=replace-this-with-a-long-random-secret-value
JWT_EXPIRES_IN=15m
```

## API Notes

- Authentication uses bearer tokens returned from `POST /auth/login`
- Protected management routes require `Authorization: Bearer <token>`
- Public redirects remain unauthenticated
- Disabled links return `404` instead of redirecting
- Re-enabled links resolve publicly again
- Rate limiting is applied to auth and protected write routes
- CORS is configured for the Branchly frontend origin, not arbitrary public origins

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

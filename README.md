# BranchlyAPI

BranchlyAPI is the backend for Branchly, a private link management product. It handles user authentication, owned-link management, and public short-code redirects with lifecycle controls like disable, enable, and expiry.

## Why This Exists

BranchlyAPI is being built as the product backend for Branchly rather than as a generic public API platform. The goal is a backend that feels production-minded, maintainable, and ready to support a real frontend application.

## API Endpoints

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | No | Create a user account |
| `POST` | `/auth/login` | No | Authenticate and receive a bearer token |
| `POST` | `/links` | Yes | Create a short link |
| `GET` | `/links` | Yes | List owned links with `limit` and `offset` |
| `GET` | `/links/:id` | Yes | Get owned link details |
| `PATCH` | `/links/:id/disable` | Yes | Disable an owned link |
| `PATCH` | `/links/:id/enable` | Yes | Re-enable an owned link |
| `PATCH` | `/links/:id/expire` | Yes | Set an owned link expiry time |
| `GET` | `/:shortCode` | No | Resolve a short code publicly |
| `GET` | `/health` | No | Liveness check |

## Architecture

- `src/auth` handles registration, login, JWT issuance, verification, and request authentication.
- `src/links` contains link creation, ownership-aware management flows, lifecycle controls, and public redirect resolution.
- `src/config`, `src/prisma`, and `src/health` cover runtime configuration, database wiring, and operational endpoints.

Controllers stay thin, use cases own application behavior, and repositories isolate persistence details.

## Stack

- NestJS
- Fastify
- Prisma
- PostgreSQL
- JWT auth
- Zod env validation
- Jest unit and e2e tests

## Example Requests

Log in:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"alex@example.com\",\"password\":\"my-secure-password\"}"
```

Create a short link:

```bash
curl -X POST http://localhost:3000/links \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{\"originalUrl\":\"https://example.com/articles/clean-architecture\"}"
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

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy `.env.example` to `.env` and set the required values.

3. Start Postgres and apply migrations:

```bash
pnpm db:setup
```

4. Start the API:

```bash
pnpm start:dev
```

The API runs on `http://localhost:3000` by default.

## Testing

- `pnpm test` runs the unit test suite.
- `pnpm test:e2e` runs the database-backed end-to-end suite.
- `pnpm lint` checks code quality.
- `pnpm build` verifies the Nest app compiles cleanly.

## Runtime Notes

- Disabled or expired links return `404` on the public redirect route.
- Swagger docs and readiness checks are not exposed in production.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

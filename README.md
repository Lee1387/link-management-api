# BranchlyAPI

BranchlyAPI is the backend for Branchly, a private link management product.

It handles:

- user registration and login
- JWT-based authentication
- shortened link creation
- owned link management
- public short-code redirects
- disabling links so public redirects stop working

This repository is the backend only. It is being built to support the Branchly product rather than third-party self-hosting or API customisation.

## Current Features

- `POST /auth/register`
- `POST /auth/login`
- `POST /links`
- `GET /links`
- `GET /links/:id`
- `PATCH /links/:id/disable`
- `GET /:shortCode`
- `GET /health`

Additional notes:

- `GET /links` supports `limit` and `offset`
- `GET /health/ready` is hidden in production
- Swagger docs are available outside production at `/docs`

## Stack

- NestJS
- Fastify
- Prisma
- PostgreSQL
- JWT auth
- Zod env validation
- Jest e2e and unit tests

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

The API will run on `http://localhost:3000` by default.

## Useful Commands

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
- Rate limiting is applied to auth and protected write routes
- CORS is configured for the Branchly frontend origin, not arbitrary public origins

## Product Direction

BranchlyAPI is intentionally opinionated:

- it is the backend for the Branchly product
- it is not being shaped as a generic public developer platform
- production defaults are private-product oriented
- browser access is expected to come from the Branchly frontend

## Status

The current backend supports the core flow:

1. register
2. login
3. create a short link
4. list owned links
5. view owned link details
6. disable a link
7. redirect by short code while active

## License

This project is currently marked `UNLICENSED`.

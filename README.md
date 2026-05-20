# Backend - Nova Budget

API NestJS + Prisma + PostgreSQL.

## Installation

```bash
npm install
```

## Configuration

Copiez `.env.example` vers `.env` puis configurez :

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT`

## Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

## Lancer l'API

```bash
npm run start:dev
```

## Seed demo

```bash
npm run seed:demo
```

## Modules

- `auth/`
- `users/`
- `transactions/`
- `categories/`
- `projections/`
- `prisma/`

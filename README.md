# Backend - SimplyRich

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
- `APPLE_CLIENT_IDS` (ex: `com.lemachlabs.simplyrich` ou `com.lemachlabs.simplyrich,host.exp.Exponent` pour tests Expo Go)
- `PLAID_CLIENT_ID` (optionnel, requis pour activer la connexion bancaire)
- `PLAID_SECRET` (optionnel, requis pour activer la connexion bancaire)
- `PLAID_ENV` (`sandbox`, `development`, `production`)
- `PLAID_COUNTRY_CODES` (ex: `FR` ou `FR,DE`)
- `PLAID_DAYS_REQUESTED` (30-730, recommande >= 180)
- `PLAID_WEBHOOK_URL` (optionnel)
- `PLAID_REDIRECT_URI` (optionnel, utile OAuth)
- `PLAID_ENABLE_HOSTED_LINK=true` (optionnel)

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
- `banking/`
- `prisma/`

## API Banking

Endpoints proteges JWT :

- `GET /banking/connections`
- `POST /banking/link-token`
- `POST /banking/exchange-public-token`
- `POST /banking/finalize-link-token`
- `POST /banking/connections/:id/sync`
- `GET /banking/recurring-analysis`
- `DELETE /banking/connections/:id`

Le module banking :

- lie un compte bancaire via Plaid,
- synchronise les transactions (added/modified/removed),
- detecte revenus et depenses recurrents,
- cree/met a jour des transactions recurrentes locales pour alimenter les projections existantes.

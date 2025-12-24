# Panda Express Dashboard - Backend

Backend API for Panda Express store dashboard built with AdonisJS, TypeScript, and PostgreSQL (Prisma).

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

3. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Start the development server:
```bash
npm run dev
```

## Authentication

Simple password-based authentication. Set the `AUTH_PASSWORD` in your `.env` file. The backend will verify passwords against this value.

- `POST /api/auth/login` - Login with password
- `GET /api/auth/verify` - Verify authentication status

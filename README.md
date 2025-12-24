# Panda Express Store Dashboard

Internal dashboard for managing Panda Express store data.

## Project Structure

This project consists of two separate applications:

- **Backend** (`/backend`) - AdonisJS API with PostgreSQL (Prisma)
- **Frontend** (`/frontend`) - React app with shadcn/ui components and Zustand

## Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your database URL and password:
```
DATABASE_URL="postgresql://user:password@localhost:5432/panda_express_db?schema=public"
AUTH_PASSWORD="your-secure-password-here"
```

5. Set up database:
```bash
npx prisma migrate dev
npx prisma generate
```

6. Start the backend server:
```bash
npm run dev
```

Backend runs on `http://localhost:3333`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Authentication

Simple password-based authentication. The backend verifies the password against the `AUTH_PASSWORD` environment variable.

## Tech Stack

- **Backend**: AdonisJS 6, TypeScript, PostgreSQL, Prisma
- **Frontend**: React, TypeScript, Vite, shadcn/ui, Zustand, Tailwind CSS

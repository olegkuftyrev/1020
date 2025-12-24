# Panda Express Dashboard - Frontend

Frontend dashboard for Panda Express store built with React, TypeScript, shadcn/ui, and Zustand.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install shadcn/ui components as needed:
```bash
npx shadcn@latest add [component-name]
```

3. Start the development server:
```bash
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API requests to the backend at `http://localhost:3333`.

## Project Structure

```
src/
  components/     # React components (including shadcn/ui components)
  stores/         # Zustand stores for state management
  lib/            # Utility functions
  App.tsx         # Main app component
  main.tsx        # Entry point
```

## Authentication

Simple password-based authentication. Use the auth store (`useAuthStore`) to handle login/logout.

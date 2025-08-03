# Project Documentation

## Overview
This is a full-stack JavaScript application built with Express.js backend and React frontend using Vite. The project follows modern web development patterns with a PostgreSQL database for data persistence.

## Project Architecture

### Database
- **PostgreSQL with Neon**: Added on 2025-08-03
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Defined in `shared/schema.ts`
- **Connection**: Configured in `server/db.ts` using Neon serverless driver

### Backend
- **Framework**: Express.js
- **Storage**: DatabaseStorage class implementing IStorage interface
- **Routes**: Defined in `server/routes.ts`
- **Database Integration**: Connected to PostgreSQL via Drizzle ORM

### Frontend
- **Framework**: React with Vite
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state

### Key Files
- `shared/schema.ts`: Database schema and type definitions
- `server/db.ts`: Database connection configuration
- `server/storage.ts`: Data access layer with DatabaseStorage implementation
- `server/routes.ts`: API route definitions
- `client/src/App.tsx`: Frontend entry point

## Recent Changes

### 2025-08-03: Database Integration
✓ Created PostgreSQL database using Neon
✓ Updated storage layer from MemStorage to DatabaseStorage
✓ Pushed schema to database using `npm run db:push`
✓ Implemented database connection with proper error handling

## User Preferences
- None specified yet

## Development Setup
- Run `npm run dev` to start both frontend and backend servers
- Database migrations handled via `npm run db:push`
- Environment variables managed automatically by Replit
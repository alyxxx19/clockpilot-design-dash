# Project Documentation

## Overview
This is a full-stack JavaScript application designed to manage employee data, planning, time entries, and tasks for businesses, ensuring compliance with labor laws. The system aims to streamline HR and project management workflows, offering features like comprehensive authentication, detailed employee management, advanced planning with legal constraints (e.g., French labor laws), robust time tracking with anomaly detection, and a user-friendly interface. It targets a broad market, providing a scalable and efficient solution for workforce management.

## User Preferences
- None specified yet

## System Architecture

### Database
- **Technology**: PostgreSQL with Neon for serverless capabilities
- **ORM**: Drizzle ORM for type-safe interactions
- **Schema**: Centralized in `shared/schema.ts`, defining entities like users, employees, departments, projects, planning entries, time entries, tasks, settings, and validations with comprehensive relations and performance-optimized indexes.

### Backend
- **Framework**: Express.js
- **Data Access**: `DatabaseStorage` class implementing an `IStorage` interface for CRUD operations.
- **API**: Defined in `server/routes.ts`, including comprehensive APIs for authentication (JWT-based with token refresh and blacklist), employee management (CRUD, pagination, filtering, stats), planning (generation, validation workflow, conflict detection, legal constraints), and time entries (tracking, overtime calculation, anomaly detection, bulk operations).
- **Security**: JWT authentication with role-based access control and Zod validation for all API endpoints.

### Frontend
- **Framework**: React with Vite
- **Routing**: Wouter for client-side navigation.
- **Styling**: Tailwind CSS with shadcn/ui components for a modern UI/UX, including a professional marketing landing page with various dedicated components.
- **State Management**: TanStack Query (React Query) for server state management, optimized with caching, automatic refetching, optimistic updates, query key factories, and performance debugging tools.
- **Integration**: Comprehensive `api.ts` utility with Axios for type-safe API calls, JWT token management, and interceptors for automatic token handling and error management.
- **UI/UX**: Features advanced filtering systems (search, multi-select, date ranges, boolean toggles) across list pages, responsive design, smooth scrolling, and animations.

### Core System Features
- **Comprehensive Database Schema**: Robust structure for various HR and project management entities.
- **JWT Authentication System**: Secure user registration, login, logout, and token refresh with role-based access control.
- **Employee Management API**: Full CRUD operations for employees, with advanced filtering, pagination, and statistics.
- **Planning API**: Supports detailed planning, auto-generation, weekly validation, and conflict detection with business logic incorporating legal constraints (e.g., 10h/day, 48h/week, 11h rest).
- **Time Entries API**: Real-time time tracking, overtime calculation, overlap validation, anomaly detection (e.g., missing breaks, unauthorized overtime), and planning vs. actual analysis.
- **Advanced Filtering System**: Centralized `FilterBar` component and `useFilters` hook for consistent filtering, URL synchronization, and backend query parameter validation across all list views.
- **Export Functionality**: Excel and PDF export options for filtered data.

## External Dependencies
- **PostgreSQL**: Primary database for data persistence.
- **Neon**: Serverless Postgres platform.
- **Express.js**: Backend web framework.
- **React**: Frontend UI library.
- **Vite**: Frontend build tool.
- **Drizzle ORM**: Object-Relational Mapper for database interactions.
- **Wouter**: React routing library.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Component library built with Tailwind CSS.
- **TanStack Query (React Query)**: Data fetching and state management library.
- **Axios**: HTTP client for API requests.
- **bcrypt**: For password hashing.
- **Zod**: For schema validation.

## Testing Infrastructure (2024-08-03)
- **Jest**: Primary testing framework with multi-project setup for backend/frontend separation
- **React Testing Library**: Frontend component and integration testing
- **Supertest**: Backend API integration testing
- **MSW (Mock Service Worker)**: API mocking for frontend tests
- **Coverage**: Comprehensive test suite targeting 70% minimum coverage across all critical paths
- **Test Categories**: Authentication, business logic, API integration, component interaction, user workflows
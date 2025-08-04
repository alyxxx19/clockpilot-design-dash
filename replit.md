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
- **API**: Comprehensive APIs for authentication (JWT-based with token refresh and blacklist), employee management (CRUD, pagination, filtering, stats), planning (generation, validation workflow, conflict detection, legal constraints), and time entries (tracking, overtime calculation, anomaly detection, bulk operations).
- **Security**: JWT authentication with role-based access control and Zod validation for all API endpoints.
- **QueryBuilder System**: Centralized QueryBuilder class with advanced filtering capabilities including full-text search, combinable filters, multi-column sorting, and optimized query performance.

### Frontend
- **Framework**: React with Vite
- **Routing**: Wouter for client-side navigation.
- **Styling**: Tailwind CSS with shadcn/ui components for a modern UI/UX, including a professional marketing landing page.
- **State Management**: TanStack Query (React Query) for server state management, optimized with caching, automatic refetching, optimistic updates, query key factories, and performance debugging tools.
- **Integration**: Comprehensive `api.ts` utility with Axios for type-safe API calls, JWT token management, and interceptors for automatic token handling and error management.
- **UI/UX**: Features advanced filtering systems (search, multi-select, date ranges, boolean toggles) across list pages, responsive design, smooth scrolling, and animations.
- **Marketing Landing Page**: Modern landing page implemented with gradient backgrounds, animated CTAs, and content sections (problems, features, testimonials, pricing, final CTA).
- **Employee Profile Management**: Comprehensive profile page with avatar management (upload, preview, validation), editable personal information, security features (password change, 2FA preparation, active sessions), and user preferences (language, notifications, date/time format, theme).
- **Real-Time Time Tracking**: Dual implementation (React and Next.js) with real-time clock display, animated punch in/out buttons, live timer, geolocation detection, and offline mode with localStorage synchronization.
- **Notifications Center**: Full-featured notifications center with WebSocket integration for real-time delivery, day-based grouping, multi-filter system, infinite scroll pagination, and preferences management.

### Core System Features
- **Comprehensive Database Schema**: Robust structure for various HR and project management entities.
- **JWT Authentication System**: Secure user registration, login, logout, and token refresh with role-based access control.
- **Employee Management API**: Full CRUD operations for employees, with advanced filtering, pagination, and statistics.
- **Planning API**: Automatic generation, conflict detection, bulk operations, validation workflow with notifications, and French labor law constraints integration.
- **Time Entries API**: Real-time time tracking, overtime calculation, overlap validation, anomaly detection, and planning vs. actual analysis.
- **Export Functionality**: Excel and PDF export options for filtered data (planning, time entries, reports).
- **Testing Infrastructure**: Jest as primary testing framework with React Testing Library, Supertest, and MSW for comprehensive coverage across backend/frontend, API integration, and user workflows. Legal compliance testing for French labor law constraints.
- **Production Deployment Configuration**: Multi-stage Docker, Docker Compose, Nginx reverse proxy, security hardening (Helmet.js, rate limiting, CORS), monitoring with Prometheus/Grafana/Loki, CI/CD pipeline with GitHub Actions, automated backups.
- **Performance Optimization**: Frontend optimizations (code splitting, image optimization, caching), Backend optimizations (database indexes, Redis caching, API response optimization), and performance monitoring.

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
- **xlsx**: Library for Excel exports.
- **Puppeteer**: For PDF exports.
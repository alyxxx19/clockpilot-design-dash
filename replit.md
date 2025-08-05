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

## Production Configuration & Deployment (2025-01-04)
- **Environment Management**: Complete .env.example with 60+ production variables, automated generation script with secure secret creation, validation script with comprehensive checks
- **Deployment Infrastructure**: Enhanced deploy.sh script with SSL certificate monitoring, database migration automation, cache warming, health checks, Slack notifications
- **Development Tools**: docker-compose.override.yml for local development with additional services (MailHog, pgAdmin, Redis Commander), separate environment isolation
- **Documentation**: Comprehensive DEPLOYMENT.md guide with multiple deployment methods (Docker, PM2, systemd), security hardening, monitoring setup, backup procedures
- **Security & Monitoring**: SSL certificate validation, automated backup scripts, health check monitoring, performance optimization configurations

## E2E Testing Suite with Playwright (2025-01-04)
- **Comprehensive Test Coverage**: Complete Playwright E2E testing suite with 4 main test files covering authentication, employee workflows, admin workflows, and offline functionality
- **Authentication Tests**: Login/logout flows for employee/admin roles, session expiry, invalid credentials, form validation, redirect handling, "remember me" functionality
- **Employee Workflow Tests**: Dashboard navigation, planning consultation, time tracking (punch in/out), manual time entries, task management, profile updates, notifications
- **Admin Workflow Tests**: Employee CRUD operations, planning generation, time validation/approval/rejection, Excel/PDF exports, department/project management, compliance checks
- **Offline Mode Tests**: Network status detection, action queuing, synchronization, error handling, data persistence, cache management, intermittent connectivity
- **CI/CD Integration**: GitHub Actions workflow with multi-browser testing (Chrome, Firefox, Safari), mobile viewports, performance testing, artifact uploads
- **Test Infrastructure**: Authentication setup, test utilities/helpers, fixture data, comprehensive documentation, debugging tools, screenshot/video capture

## Visual Documentation System (2025-01-04)
- **Comprehensive User Guide**: Complete docs/USER_GUIDE.md with annotated screenshots covering all user workflows and admin functions
- **Automated Screenshot Generation**: Playwright script for 1200x800px PNG screenshots with realistic demo data and visual annotations
- **Image Optimization Pipeline**: Sharp, imagemin, pngquant integration for web-optimized images under 500KB
- **GIF Creation System**: Automated workflow animations for punch process, drag-drop planning, validation flow, and export generation
- **Documentation Infrastructure**: Organized screenshot folders, README documentation, Python placeholder generator, SQL demo data
- **Development Workflow**: Complete setup guide, CI/CD integration, maintenance procedures, and troubleshooting documentation

## Security Updates & Dependency Management (2025-08-05)
- **Dependency Security Updates**: Applied security updates for imagemin-gifsicle (7.0.0 → 5.2.0) and imagemin-pngquant (10.0.0 → 5.0.1)
- **Compatibility Fixes**: Updated scripts/optimize-images.js to handle API changes in downgraded dependencies with proper ES module export handling
- **Core Functionality**: Verified Sharp image processing for avatar/logo uploads still works correctly with updated dependencies
- **Testing & Verification**: Confirmed all image optimization workflows function properly with security-patched dependency versions

## Architecture Cleanup & Error Resolution (2025-08-05)
- **Critical Architecture Duplication Resolved**: Removed complete duplicate Next.js implementation in `/app` folder that was causing confusion and maintenance issues
- **Architecture Clarification**: Confirmed primary application is React/Vite in `/client/src` with Express.js backend, not Next.js
- **TypeScript Error Resolution**: Fixed all remaining LSP diagnostics (4→0) including OfflineIndicator infinite loop and API reference errors
- **Frontend Stability**: Resolved "Maximum update depth exceeded" error by implementing proper functional state updates
- **Code Quality**: Fixed all TypeScript errors across server/routes.ts, server/storage.ts, and client components
- **System Status**: Application fully operational with clean single architecture and zero security vulnerabilities
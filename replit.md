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
- **Planning API** (COMPLETED 2024-08-04): Complete 7-endpoint API implementation with automatic generation, conflict detection, bulk operations, validation workflow with notifications, and French labor law constraints integration.
- **Time Entries API**: Real-time time tracking, overtime calculation, overlap validation, anomaly detection (e.g., missing breaks, unauthorized overtime), and planning vs. actual analysis.
- **Advanced QueryBuilder System** (ENHANCED 2025-01-04): Centralized QueryBuilder class with advanced filtering capabilities including full-text search, combinable filters, multi-column sorting, and optimized query performance across employees, planning entries, and time entries.
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

## Production Documentation & Deployment (2024-08-04)
- **Complete Documentation**: README.md, USER_GUIDE.md with screenshots, .env.example template
- **Security Stack**: Helmet.js, rate limiting, CORS, Winston logging, compression middleware
- **Deployment Infrastructure**: Multi-stage Docker, docker-compose, Nginx reverse proxy
- **API Documentation**: Swagger/OpenAPI with interactive UI at /api/docs
- **CI/CD Pipeline**: GitHub Actions with testing, building, deployment, automated backups
- **Database Management**: Backup scripts, seeding scripts, health checks, monitoring
- **Production Monitoring**: Health endpoints, structured logging, error handling, performance tracking

## Performance Optimization (2024-08-04)
- **Frontend Optimizations**: Code splitting with lazy routes, bundle optimization with manual chunks, image optimization with WebP support and lazy loading, client-side caching with LocalStorage manager, performance monitoring with Core Web Vitals tracking
- **Backend Optimizations**: Database indexes with composite and partial indexes, Redis caching with intelligent invalidation, API response optimization with compression and ETags, query optimization middleware with field selection and pagination
- **Monitoring**: Performance testing scripts, bundle analysis tools, memory monitoring, automated performance metrics collection
- **Documentation**: Complete performance guide (README-PERFORMANCE.md) with best practices, troubleshooting, and optimization roadmap

## Export Functionality (2025-01-04)
- **Complete Export System**: Fully operational Excel and PDF export functionality for planning data, time entries, and monthly reports
- **Technologies**: Excel exports using `xlsx` library, PDF exports using Puppeteer with Chromium browser engine
- **Security**: JWT-based authentication on all export endpoints with role-based access control
- **Formats**: Support for both Excel (.xlsx) and PDF formats across all export types
- **Infrastructure**: Chromium properly configured for Replit environment with appropriate system dependencies
- **Performance**: Optimized export generation with proper memory management and timeout handling

## Production Deployment Configuration (2025-01-04)
- **Docker Setup**: Multi-stage Dockerfile with security hardening, non-root user, health checks, and Chromium support
- **Container Orchestration**: Production docker-compose.yml with PostgreSQL, Redis, Nginx, monitoring stack (Prometheus, Grafana, Loki)
- **Security Stack**: Helmet.js security headers, enhanced rate limiting (auth, API, strict tiers), compression, request timeouts
- **Health Monitoring**: Advanced health checks (/api/health/live, /api/health/ready), Prometheus metrics, structured Winston logging
- **CI/CD Pipeline**: GitHub Actions workflow with testing, security scanning (Trivy), staging/production deployment, rollback strategies
- **Nginx Configuration**: Production-ready reverse proxy with SSL, rate limiting, security headers, static asset caching
- **Backup & Recovery**: Automated database backups with S3 storage, retention policies, restore scripts
- **Monitoring Stack**: Complete observability with Prometheus metrics, Grafana dashboards, Loki log aggregation, alerting rules
- **Deployment Tools**: Automated deployment script with health checks, rollback capabilities, and production checklist

## Comprehensive Testing Suite (2025-01-04)
- **Complete Test Coverage**: Implemented comprehensive Jest testing suite covering all application layers with 70% minimum coverage target
- **Backend Testing**: Complete API tests for employees, planning, time entries, projects/tasks with legal constraint validation and business logic testing
- **Integration Testing**: Full workflow tests covering planning→time entry→validation flows, bulk operations, and error recovery scenarios
- **Frontend Testing**: React component tests with React Testing Library, API hooks testing with MSW, and user interaction validation
- **Legal Compliance Testing**: Comprehensive validation of French labor law constraints (10h/day, 48h/week, 11h rest periods)
- **Performance Testing**: Load testing for large datasets, concurrent request handling, and response time validation
- **Testing Infrastructure**: Multi-project Jest configuration, MSW for API mocking, comprehensive test helpers and fixtures
- **Documentation**: Complete testing guide (README-TESTS.md) with execution instructions, coverage reports, and quality standards

## Real-Time Time Tracking Implementation (2025-01-04)
- **Dual Implementation**: Complete real-time time tracking pages for both React (client/src/pages/employee/TimeTracking.tsx) and Next.js 14 App Router (app/employee/time-tracking/page.tsx)
- **Advanced Features**: Real-time clock display, animated punch in/out buttons with pulse effects, live timer when clocked in, geolocation detection, offline mode with localStorage synchronization
- **Modern UI/UX**: Professional design with round central buttons, timeline cards for daily history, green/gray color coding for status, responsive design with Tailwind CSS
- **API Integration**: Full integration with existing backend endpoints /api/time-entries/clock-in and /api/time-entries/clock-out with proper error handling
- **Offline Capabilities**: localStorage-based pending actions queue, automatic synchronization when online, user feedback for offline operations
- **Navigation Integration**: Added "Pointage temps réel" link in employee dashboard navigation with Timer icon

## Marketing Landing Page (2025-01-04)
- **Modern Landing Page**: Complete marketing landing page implemented in Next.js 14 App Router (app/page.tsx)
- **Professional Design**: Hero section with gradient backgrounds, animated CTAs, and modern UI using Tailwind CSS and Framer Motion
- **Content Sections**: Hero with value proposition, problems solved (3 cards), features showcase (6 features grid), customer testimonials (3 testimonials), pricing plans (3 tiers), and final CTA with email capture
- **Interactive Elements**: Animated scroll effects using Framer Motion, hover animations, responsive design, email capture form
- **Conversion Optimization**: Clear CTAs leading to /register and /login, demo booking integration with Calendly, pricing transparency with 14-day free trial
- **Brand Identity**: ClockPilot branding with blue gradient theme, professional French content, compliance focus for French market
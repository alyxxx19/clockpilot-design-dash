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

### 2025-08-03: Complete Database Schema Implementation
✓ Created comprehensive database schema with 8 main tables:
  - users: Base authentication table with email and role
  - employees: Extended employee data with departments and hierarchy
  - departments: Organizational structure
  - projects: Project management with budget tracking
  - projectAssignments: Many-to-many project-employee relationships
  - planningEntries: Scheduling with validation workflow
  - timeEntries: Time tracking with geolocation support
  - tasks: Task management with priorities and status
  - settings: Configurable system and user preferences
  - validations: Weekly time validation tracking
✓ Implemented comprehensive relations between all entities
✓ Added proper indexes for performance optimization
✓ Created Zod schemas for validation and TypeScript types
✓ Added enums for frontend consistency
✓ Successfully pushed schema to PostgreSQL database
✓ Fixed circular reference issues with proper foreign key definitions
✓ Updated storage interface with comprehensive CRUD operations
✓ Implemented complete authentication system with JWT tokens

### 2025-08-03: JWT Authentication System Implementation
✓ Implemented complete authentication API with 5 endpoints:
  - POST /api/auth/register: User registration with bcrypt password hashing
  - POST /api/auth/login: Email/password authentication with JWT tokens  
  - POST /api/auth/logout: Token invalidation with blacklist
  - GET /api/auth/me: Protected route to get current user info
  - POST /api/auth/refresh: JWT token renewal system
✓ Created authentication middleware (authenticateToken) for route protection
✓ Created authorization middleware (authorizeRole) for role-based access
✓ Added comprehensive error handling with specific error codes
✓ Implemented Zod validation schemas for all auth endpoints
✓ Added token blacklist system for secure logout
✓ Access tokens expire in 7 days, refresh tokens in 30 days
✓ Automatic employee profile creation during registration
✓ Protected example routes (/api/employees, /api/departments, /api/profile)

### 2025-08-03: Complete Employee CRUD API Implementation
✓ Implemented comprehensive employee management with 6 endpoints:
  - GET /api/employees: Paginated list with filters (search, department, status, sorting)
  - GET /api/employees/:id: Detailed employee info with manager/subordinates
  - POST /api/employees: Create employee with auto-generated credentials
  - PUT /api/employees/:id: Update employee (admin full access, employee limited)
  - DELETE /api/employees/:id: Soft delete with validation checks
  - GET /api/employees/:id/stats: Employee statistics (hours, vacation, projects)
✓ Advanced storage operations with complex SQL queries and joins
✓ Role-based access control (admin vs employee permissions)
✓ Comprehensive validation using Zod schemas
✓ Error handling with specific error codes
✓ Pagination and filtering system for large datasets
✓ Employee statistics calculation (weekly/monthly hours, vacation tracking)
✓ Manager-subordinate relationship handling
✓ Created test page for all CRUD operations

### 2025-08-03: Complete Planning API Implementation
✓ Implemented comprehensive planning management with 7 endpoints:
  - GET /api/planning: Filtered planning entries with date grouping and totals
  - POST /api/planning/generate: Auto-generate planning with legal constraints
  - GET /api/planning/:employee_id/week/:date: Weekly planning with time comparison
  - PUT /api/planning/:id: Update planning entry with conflict validation
  - POST /api/planning/bulk: Bulk create/update with transaction safety
  - POST /api/planning/validate: Weekly validation workflow for managers
  - GET /api/planning/conflicts: Comprehensive conflict detection system
✓ Business logic implementation with French legal constraints:
  - Maximum 10h/day and 48h/week limits enforced
  - 11-hour rest period validation between shifts
  - 35-hour weekly average target monitoring
  - Automatic conflict detection and resolution suggestions
✓ Advanced planning features:
  - Weekly planning comparison with actual time entries
  - Bulk operations with validation and rollback capability
  - Manager validation workflow with approval tracking
  - Comprehensive conflict analysis with severity levels
✓ Role-based access control for all planning operations
✓ Real-time validation with detailed error reporting

### 2025-08-03: Complete Time Entries API Implementation
✓ Implemented comprehensive time tracking system with 8 endpoints:
  - GET /api/time-entries: Filtered entries with grouping (day/week/month) and pagination
  - GET /api/time-entries/:employee_id/current: Real-time current day entries with totals
  - POST /api/time-entries: Create with auto-overlap validation and overtime calculation
  - PUT /api/time-entries/:id: Update with conflict validation (draft/submitted only)
  - DELETE /api/time-entries/:id: Delete draft entries with ownership validation
  - POST /api/time-entries/bulk: Bulk weekly operations with transaction safety
  - POST /api/time-entries/submit: Weekly submission with completeness validation
  - GET /api/time-entries/compare/:employee_id: Planning vs actual analysis
✓ Advanced business logic and automatic calculations:
  - Real-time overtime calculation based on daily (10h) and weekly (48h) limits
  - Working hours calculation with break time deduction
  - Overlap validation preventing double-booking conflicts
  - Planning association for authorized work verification
✓ Anomaly detection system with 4 types:
  - Time entries without corresponding planning (warning)
  - Large variance between planned vs actual hours (warning/info)
  - Missing breaks for shifts over 6 hours (warning)
  - Overtime without proper justification (error)
✓ Comprehensive time analysis features:
  - Daily/weekly/monthly grouping with category totals
  - Planning compliance rate and accuracy metrics
  - Overtime rate tracking and authorization verification
  - Export-ready format for payroll integration
✓ Role-based permissions ensuring data security and proper access control
✓ Interactive test page created for all time entry operations

### 2025-08-03: ClockPilot Marketing Landing Page
✓ Completely rebuilt landing page with professional marketing design
✓ Created 8 new landing components in `client/src/components/landing/`:
  - HeroSection: Main hero with French compliance badge and CTAs
  - ProblemSection: Pain points with visual icons
  - FeaturesSection: 3 key features with alternating layouts
  - SocialProofSection: Customer testimonials and stats
  - PricingSection: Single plan with interactive ROI calculator
  - SectorsSection: 4 target industry sectors
  - FAQSection: Expandable FAQ accordion
  - FinalCTASection: Final CTA with guarantees
✓ Added Header component with fixed navigation and mobile menu
✓ Added Footer component with comprehensive links and contact info
✓ Created custom landing styles in `client/src/styles/landing.css`
✓ Added required UI components: Slider, Badge
✓ Implemented smooth scrolling navigation and animations
✓ Fully responsive design for mobile, tablet, and desktop
✓ All CTAs ready for future auth integration

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
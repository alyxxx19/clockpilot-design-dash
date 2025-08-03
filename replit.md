# Overview

Clock Pilot is a comprehensive time tracking and workforce management application designed for businesses to monitor employee attendance, manage schedules, and generate detailed reports. The application features a role-based system with separate interfaces for administrators and employees, providing tools for time entry, planning management, task tracking, and reporting.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing a modern component-based architecture. The application uses React Router for navigation with role-based route protection, ensuring administrators and employees only access their designated areas. State management is handled through React Context for authentication and React Query for server state management. The UI is constructed using shadcn/ui components built on top of Radix UI primitives, providing a consistent and accessible design system.

## Styling and Design System
The application implements a minimalist black and white design system using Tailwind CSS. Custom CSS variables define the color palette, with support for both light and dark themes. The design emphasizes clean typography using the Inter font family and maintains consistent spacing and component sizing throughout the interface.

## Authentication and Authorization
A context-based authentication system manages user sessions with role-based access control. The system supports two user roles: admin and employee, each with distinct navigation paths and functionality. Demo accounts are available for testing purposes, allowing users to experience both admin and employee interfaces without backend integration.

## Component Structure
The application follows a well-organized component hierarchy with shared UI components, layout components for different user roles (AdminSidebar, DashboardLayout), and page-specific components. Form handling is implemented using React Hook Form with Zod validation schemas for type-safe data validation.

## Backend Architecture
The backend is built with Express.js and TypeScript, following a modular route structure. The server implements middleware for request logging, JSON parsing, and error handling. Development and production environments are configured differently, with Vite integration for development hot reloading.

## Data Management
The application uses Drizzle ORM for database operations with PostgreSQL as the primary database. Schema definitions are shared between frontend and backend using TypeScript types. A memory storage interface is implemented for development purposes, allowing the application to function without a database connection.

## Development Tooling
The build system uses Vite for frontend bundling and esbuild for backend compilation. TypeScript configuration supports path mapping for clean imports, and the project includes comprehensive linting and formatting rules. Hot reloading is enabled in development mode with proper error overlays.

# External Dependencies

## Database and ORM
- **PostgreSQL**: Primary database using Neon Database serverless solution
- **Drizzle ORM**: Type-safe database operations with schema migrations
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI and Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Comprehensive icon library
- **shadcn/ui**: Pre-built component library built on Radix UI

## State Management and Data Fetching
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Performant form handling with minimal re-renders
- **Zod**: Schema validation for type-safe data handling

## Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

## Authentication and Security
- **Nanoid**: Secure URL-friendly unique ID generation
- **bcrypt**: Password hashing for secure authentication (ready for implementation)

## Utility Libraries
- **date-fns**: Modern date utility library for date manipulation
- **clsx**: Utility for constructing className strings conditionally
- **class-variance-authority**: Type-safe variant generation for components
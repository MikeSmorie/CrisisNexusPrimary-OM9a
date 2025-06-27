# AI-PA-OM9 Executive Co-Pilot Architecture

## Overview

AI-PA-OM9 is a comprehensive executive assistance platform that combines AI-powered workflow automation, intelligent decision support, and executive co-pilot capabilities. The platform features a modular architecture with role-based access control, multi-provider AI integration through the OmegaAIR multiplexer system, and advanced payment processing capabilities. This is an independent fork of Omega-V9, isolated and configured for executive assistance use cases.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui component library with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Theme System**: Dark/light mode with persistent localStorage

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Authentication**: Passport.js with session-based authentication
- **Database**: PostgreSQL with Drizzle ORM
- **API Design**: RESTful endpoints with middleware-based security
- **Session Management**: Memory store with configurable security settings

## Key Components

### Authentication System
- **Multi-role Support**: User, Admin, and Supergod roles with hierarchical permissions
- **Session Security**: HttpOnly cookies with CSRF protection
- **Password Reset**: Secure token-based password reset flow
- **Email Verification**: Cryptographic token verification with sandbox bypass for development
- **Multi-device Logout**: Token versioning system for session invalidation

### OmegaAIR Multiplexer System
- **Dynamic Provider Routing**: Intelligent AI provider selection with fallback handling
- **Supported Providers**: OpenAI (configured), Claude (stub), Mistral (stub)
- **Configuration Management**: JSON-based routing configuration with priority ordering
- **Error Handling**: Comprehensive fallback system with graceful degradation
- **Module Integration**: Standardized AI request interface for all modules

### Subscription Management
- **Three-tier System**: Free, Pro, and Enterprise plans with feature-based access control
- **Payment Integration**: PayPal Server SDK with webhook support
- **Trial Management**: 14-day trials with automatic expiration
- **Executive Bypass**: Admin and Supergod roles bypass all subscription restrictions

### Logging and Monitoring
- **Comprehensive Logging**: System-wide error capture with severity levels
- **Audit Trail**: User action tracking with metadata storage
- **Error Boundary**: React error boundary with automatic reporting
- **Real-time Monitoring**: Admin dashboard with filtering and export capabilities

## Data Flow

### Authentication Flow
1. User submits credentials via login form
2. Passport.js validates against database
3. Session created with secure cookie
4. Role-based permissions applied to subsequent requests
5. JWT tokens generated for API access with version control

### AI Request Flow
1. Module initiates AI request through OmegaAIR router
2. Router checks provider availability and selects best option
3. Request sent to selected provider with fallback handling
4. Response processed and returned to requesting module
5. Usage logged for monitoring and billing purposes

### Payment Processing Flow
1. User selects subscription plan
2. PayPal order created with payment details
3. User completes payment through PayPal interface
4. Webhook confirms payment completion
5. User subscription updated and access granted

## External Dependencies

### Payment Providers
- **PayPal Server SDK**: Primary payment processing with sandbox/production environments
- **Webhook System**: Real-time payment status updates

### AI Providers
- **OpenAI API**: Primary AI provider with GPT models
- **Claude API**: Secondary provider (stub implementation ready)
- **Mistral API**: Tertiary provider (stub implementation ready)

### Communication Services
- **SendGrid**: Email delivery for verification and notifications (configured but not implemented)

### Development Tools
- **Drizzle ORM**: Type-safe database operations with migration support
- **Vite**: Frontend build tool with hot reload
- **TypeScript**: Full-stack type safety

## Deployment Strategy

### Environment Configuration
- **Multi-environment Support**: Development, staging, and production configurations
- **Secret Management**: Environment variables for API keys and sensitive data
- **Database Provisioning**: PostgreSQL with connection pooling

### Build Process
- **Frontend**: Vite build with optimized bundles
- **Backend**: ESBuild compilation for Node.js deployment
- **Database**: Drizzle migrations with schema validation

### Infrastructure
- **Replit Integration**: Configured for cloud deployment with port forwarding
- **Session Storage**: Memory store with configurable persistence
- **Static Assets**: Optimized serving with proper caching headers

## Changelog

```
Changelog:
- June 27, 2025. Critical Deployment Issue Resolved - Payment System Fixed
  - Replaced dynamic wildcard imports with explicit static imports
  - Created payment provider registry eliminating build-time path resolution errors
  - Fixed provider name mapping with case-insensitive lookup system
  - Verified all payment providers (PayPal, Solana, Flutterwave) functional
  - Payment processing endpoints now deployment-ready with proper import structure
  - Maintained backward compatibility with existing payment database structure

- June 25, 2025. Email Verification Bypass Implementation Completed
  - Added bypass checkbox to authentic SecureAuthPage login form
  - Implemented development environment detection and bypass logic
  - Created anti-counterfeit verification with environment display
  - Added yellow warning banners and visual indicators for bypass mode
  - Backend bypass logic processes skipEmailVerification parameter
  - Production safety maintained with environment-based controls
  - Consolidated admin sidebar with expandable dropdown navigation

- June 25, 2025. Fork Purity SOP Completed - AI-PA-OM9 Independent Fork
  - Database isolation: Complete user/log data purge, fresh seed user
  - Environment clean: API keys reset to placeholders, aipa_fork=true added
  - AI routing reset: Priority reordered (OpenAI > Mistral > Claude)
  - Branding sanitization: README, replit.md updated to AI-PA-OM9
  - Fork metadata: Created meta/fork-origin.json with lineage tracking
  - Functional verification: Login, AI requests, admin access confirmed
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
UI Design: Clean, minimal, professional appearance without excessive warnings or cluttered styling.
```
# DisasterMng-1-OM9 Emergency Response Platform

## Overview

DisasterMng-1-OM9 is a comprehensive emergency management and disaster response platform that combines AI-powered incident coordination, real-time resource management, and emergency communication capabilities. The platform features a specialized architecture with role-based emergency access control, disaster-specific AI integration through the OmegaAIR multiplexer system, and emergency response coordination tools. This is an independent fork of Omega-V9, completely isolated and configured for emergency management and disaster response use cases.

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

### Emergency Authentication System
- **Multi-role Support**: Responder, Commander, Admin, and Coordinator roles with emergency hierarchy
- **Enhanced Security**: Two-factor authentication enabled by default for all emergency personnel
- **Emergency Access**: Secure token-based emergency access protocols
- **Credential Verification**: Emergency credential verification with development bypass for testing
- **Session Management**: Emergency session management with incident-based access control

### Emergency AI Coordination System (OmegaAIR)
- **Emergency Context Processing**: AI providers isolated with no fallbacks for security
- **Disaster-Specific Routing**: Emergency response context prefixing for all AI requests
- **Provider Isolation**: All AI providers require manual configuration - no defaults
- **Security Protocols**: Safety-first AI routing with emergency response prioritization
- **Incident Integration**: AI assistance integrated with incident management workflows

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
- July 9, 2025. DisasterMng-1-OM9 Complete Project Initialization
  - Full database isolation: All previous data purged and replaced with disaster management schema
  - Emergency schema implementation: disaster_ prefixed tables for incidents, resources, alerts, communications
  - Authentication system updated: disaster_users table with emergency roles (responder, commander, admin)
  - AI system isolation: All AI providers disabled by default, require manual emergency configuration
  - Disaster-specific UI: Emergency Operations Center dashboard as default interface
  - Theme update: Emergency response color scheme (red primary, amber warnings)
  - API endpoints: Complete disaster management REST API with incident tracking
  - Project identity: DisasterMng-1-OM9 isolated fork with emergency response focus
  - Security enhancement: Two-factor authentication enabled by default for all personnel
  - Seed data: Emergency management personnel (admin, chief_fire, medic_1) initialized
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
UI Design: Clean, minimal, professional appearance without excessive warnings or cluttered styling.
```
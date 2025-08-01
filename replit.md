# DisasterMng-1-OM9 Emergency Response Platform

## Overview
DisasterMng-1-OM9 is a comprehensive emergency management and disaster response platform. It integrates AI-powered incident coordination, real-time resource management, and emergency communication capabilities. Key features include role-based emergency access control, disaster-specific AI integration via the OmegaAIR multiplexer, and specialized emergency response coordination tools. This platform is an isolated fork of Omega-V9, specifically configured for emergency management and disaster response. Its business vision is to provide a robust, AI-enhanced system for rapid and effective disaster response, with market potential in governmental agencies, NGOs, and large organizations requiring sophisticated emergency coordination.

## User Preferences
Preferred communication style: Simple, everyday language.
UI Design: Clean, minimal, professional appearance without excessive warnings or cluttered styling.
Dark Mode Accessibility: Ensure strong contrast between font and background colors in both light and dark modes.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui component library with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Theme System**: Dark/light mode with persistent localStorage
- **UI/UX Decisions**: Clean, minimal design; responsive layout with mobile-first interfaces; emergency color scheme (red primary, amber warnings); touch-optimized design (44px minimum targets); real-time updates (5-30 second refresh).
- **Five-role interface system**: Field Responder, Commander, Admin Oversight, AI Monitor, Mobile Compact views.

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Authentication**: Passport.js with session-based authentication; multi-role support (Responder, Commander, Admin, Coordinator) with emergency hierarchy; two-factor authentication enabled by default; secure token-based emergency access; incident-based access control.
- **Database**: PostgreSQL with Drizzle ORM; full database isolation with disaster-specific schema (disaster_ prefixed tables).
- **API Design**: RESTful endpoints with middleware-based security.
- **Session Management**: Memory store with configurable security settings.

### Key Features & Design Patterns
- **Emergency AI Coordination System (OmegaAIR)**: AI providers isolated for security; emergency response context prefixing for all AI requests; manual configuration required for all AI providers; safety-first AI routing; AI assistance integrated with incident management workflows.
- **Subscription Management**: Three-tier system (Free, Pro, Enterprise); executive bypass for Admin and Supergod roles.
- **Logging and Monitoring**: System-wide error capture; audit trail for user actions; React error boundary; real-time monitoring dashboard; immutable audit trail system (blockchain-based logging planned for future phases).
- **Confidentiality & Clearance Layer**: Military-grade access control (SCI/SAP-based); five-tier clearance system (UNCLASSIFIED to FORENSIC ONLY); compartmentalization model; data redaction engine; emergency override system; comprehensive audit trail.
- **Multi-Layer Redundancy & Failover Communication System**: 5-tier communication failover (Satellite → Internet → GSM → Mesh/Helium → Voice-to-Text offline); automatic failover logic; emergency broadcast system.
- **Automated Emergency Response Workflow**: Auto-translation and auto-dispatch to responder in preferred language.
- **Health Check Implementation**: Comprehensive health check endpoints (`/` and `/health`).

## External Dependencies

### Payment Providers
- **PayPal Server SDK**: Primary payment processing with webhook support.

### AI Providers
- **OpenAI API**: Primary AI provider (GPT models).
- **Claude API**: Secondary provider (stub implementation ready).
- **Mistral API**: Tertiary provider (stub implementation ready).

### Communication Services
- **SendGrid**: Email delivery for verification and notifications.

### Development Tools
- **Drizzle ORM**: Type-safe database operations and migrations.
- **Vite**: Frontend build tool.
- **TypeScript**: Full-stack type safety.
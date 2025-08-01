# DisasterMng-1-OM9 Emergency Response Platform

## Overview
DisasterMng-1-OM9 is a comprehensive emergency management and disaster response platform. It integrates AI-powered incident coordination, real-time resource management, and emergency communication capabilities. This platform is a specialized fork of Omega-V9, configured specifically for emergency management and disaster response use cases, emphasizing a robust architecture with role-based emergency access control and disaster-specific AI integration via the OmegaAIR multiplexer system. Its core purpose is to streamline emergency response coordination and provide critical tools for effective disaster management.

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
- **UI/UX Decisions**: Professional appearance, clean and minimal design, strong contrast for dark/light modes, touch-optimized design for field use, real-time updates (5-30 second refresh).

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Authentication**: Passport.js with session-based authentication
- **Database**: PostgreSQL with Drizzle ORM
- **API Design**: RESTful endpoints with middleware-based security
- **Session Management**: Memory store with configurable security settings

### Key Architectural Components
- **Emergency Authentication System**: Multi-role support (Responder, Commander, Admin, Coordinator) with enhanced security (2FA by default), secure token-based emergency access, and incident-based access control.
- **Emergency AI Coordination System (OmegaAIR)**: AI providers isolated with no fallbacks for security, disaster-specific routing, manual configuration for all AI providers, and safety-first AI routing prioritizing emergency response. AI assistance is integrated with incident management workflows for threat assessment and dialogue management.
- **Subscription Management**: A three-tier system (Free, Pro, Enterprise) for feature-based access, integrated with PayPal. Includes trial management and executive bypass for Admin/Supergod roles.
- **Logging and Monitoring**: Comprehensive logging (system-wide error capture), audit trail for user actions, React error boundary, and real-time monitoring via an admin dashboard. Includes immutable audit logging with blockchain aspirations (Forensic Dashboard).
- **Communication Center**: A 5-tier failover communication system (Satellite → Internet → GSM → Mesh/Helium → Voice-to-Text offline) with automatic failover logic, real-time monitoring, and emergency broadcast capabilities.
- **Clearance Management**: A military-grade access control system (SCI/SAP-based) with a five-tier clearance system (UNCLASSIFIED to FORENSIC ONLY), compartmentalization, data redaction, and an emergency override system.
- **Modular Design**: Comprises 7 core modules (Incident Management, Emergency Alerts, Resource Deployment, Communication Center, Forensic Dashboard, Clearance Management, Emergency Operations) with defined interdependencies.

## External Dependencies

### Payment Providers
- **PayPal Server SDK**: Primary payment processing.

### AI Providers
- **OpenAI API**: Primary AI provider (GPT models).
- **Claude API**: Secondary provider (stub implementation).
- **Mistral API**: Tertiary provider (stub implementation).

### Communication Services
- **SendGrid**: Email delivery (configured).

### Development Tools
- **Drizzle ORM**: Type-safe database operations.
- **Vite**: Frontend build tool.
- **TypeScript**: Full-stack type safety.
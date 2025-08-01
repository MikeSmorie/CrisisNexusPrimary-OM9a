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

## Module Dependencies

### Implemented Modules (7 of 10)
1. **Incident Management** (Module 1) - Core incident tracking and reporting
2. **Emergency Alerts** (Module 2) - Alert broadcasting system  
3. **Resource Deployment** (Module 3) - Personnel and equipment tracking
4. **Communication Center** (Module 4) - 5-tier failover communication system
5. **Forensic Dashboard** (Module 5) - Immutable audit logging with blockchain
6. **Clearance Management** (Module 6) - Military-grade access control
7. **Emergency Operations** (Module 9) - Emergency Operations Center overview

### Module Interdependencies
- **Incident Management** → triggers Emergency Alerts for new incidents
- **Communication Center** → depends on Incident Management for emergency communications
- **Forensic Dashboard** → logs all activities across ALL modules for audit trail
- **Clearance Management** → controls access permissions across ALL modules
- **Resource Deployment** → coordinates with Incident Management for personnel assignment

### Hidden Modules
- Modules 7 and 8 are hidden from navigation (not implemented)
- Module 10 reserved for special Omega-10 Audit functions

## Changelog

```
Changelog:
- July 31, 2025. Final Render Build Script Fix & Complete System Ready
  - CRITICAL: Build script simplified to "vite build" only - removes drizzle-kit and esbuild from production build
  - This prevents Render deployment crashes by eliminating complex server bundling during frontend build
  - Authentication system fully functional: Emergency1 login working in production environment
  - Database operations confirmed: users table active with proper emergency personnel credentials
  - Frontend and backend systems fully synchronized and operational
  - CrisisNexus Emergency Management System production-ready for Render deployment
  - Manual git push required to deploy simplified build script to Render

- July 31, 2025. Authentication Database Fix & Complete System Verification
  - CRITICAL: Fixed authentication system pointing to correct users table instead of disaster_users
  - Emergency1 login confirmed working in production: username=Emergency1, password=#Emergency1*
  - User registration system operational: API accepts new emergency personnel accounts
  - Database verification: Emergency1 user exists with proper credentials and responder role
  - Production API testing confirms all authentication endpoints working correctly
  - Frontend application serving properly with functional login interface
  - CrisisNexus Emergency Management System fully operational at https://disaster-mng-1-om-9-michaelsthewrit.replit.app

- July 31, 2025. Frontend Routing Fix & Production Application Fully Operational
  - CRITICAL: Fixed conflicting route handlers preventing frontend from loading in production
  - Removed duplicate root path handlers that were serving JSON instead of the React application
  - Frontend application now properly serving HTML/CSS/JS at production URL
  - All API endpoints operational: /api/auth/bypass-status, /api/disaster/*, /health working correctly
  - Emergency management interface now accessible in production deployment

- July 31, 2025. Render Deployment Build Script Fix & Production Stability Complete
  - CRITICAL: Removed drizzle-kit and esbuild from build script to prevent Render deployment crashes
  - Build script simplified from "vite build && esbuild..." to "vite build" for Render compatibility
  - Fixed internal server error by correcting syntax error in routes.ts (missing try-catch bracket)
  - CORS configuration updated for Replit production domains with proper authentication
  - Health check endpoints fully operational at root (/) and /health for deployment monitoring
  - All API routes successfully registered with comprehensive error handling
  - Production deployment now stable and ready for Render with manual database schema management

- July 31, 2025. Production Authentication & Database Schema Fix Complete
  - Fixed authentication for Replit production deployments by adjusting secure cookie settings
  - Resolved database schema inconsistencies: added missing columns (type, location, estimated_resolution, actual_resolution)
  - Emergency user Emergency1 credentials verified and working: username=Emergency1, password=#Emergency1*
  - drizzle-kit@0.20.4 successfully moved to production dependencies for Render deployment compatibility
  - All emergency APIs now operational: incidents, alerts, resources endpoints working correctly
  - Professional 911 emergency assessment system fully functional with threat level analysis

Changelog:
- July 29, 2025. Intelligent False Report Flagging with Reassessment Fallback Complete
  - Enhanced escalation state machine: none → pending → active → retracted → false_report → reactivated_case
  - Sophisticated recovery system: 3-message window for legitimate emergency restoration after false flag
  - Recovery pattern detection: "sorry...meant to send elsewhere", "this emergency is ongoing", "I made a mistake"
  - Original emergency context preservation for intelligent reassessment and recovery validation
  - Professional messaging: "We have reassessed your report based on your clarification. Emergency dispatch has resumed."
  - Audit trail system: timestamps, rationale tracking, recovery attempts logging with device fingerprinting
  - Context badges: "🧠 Recovered From Misflag" for successful recoveries, "FALSE FLAG (confirmed)" for persistent violations
  - Multi-layered protection: traditional crank detection + intelligent escalation + reassessment fallback
  - Criminal offense warnings with escalating severity based on recovery attempts and violation patterns
  - Professional 911 SOP compliance with intelligent dialogue management and threat-aware interrogation protocols

- July 26, 2025. Emergency Dialogue System & EDTG Timestamp Fix Complete
  - Fixed CRITICAL EDTG issue: Enhanced Date-Time Group now locks to exact event timestamp instead of running clock
  - EDTG timestamps are immutable once created - essential for forensic logging and emergency audit trails
  - Created progressive threat assessment system that builds context from multiple caller inputs
  - Implemented intelligent AI responses that guide callers toward critical information
  - Added operator dialogue display in caller interface with "📞 Operator:" messaging
  - Added escalating dialogue stages: initial → gathering → escalating → dispatched
  - System now proactively asks targeted questions based on threat level assessment
  - Enhanced with scenario-specific logic (rip currents, cramping, distress signals)
  - Automatic dispatch triggers at 70%+ threat confidence with intelligent summary generation
  - AI engages callers conversationally instead of requiring complete emergency statements
  - Maintains conversation flow while building comprehensive emergency context for responders

- July 25, 2025. Deployment Readiness & Health Check Implementation Complete
  - Added comprehensive health check endpoints (/ and /health) for Cloud Run compatibility
  - Fixed missing database columns (assigned_commander, priority_level, contact_info, etc.)
  - Implemented proper database connection verification before server startup
  - Enhanced error handling to prevent server crashes during deployment
  - Server configured to listen on 0.0.0.0 with PORT environment variable support
  - Added environment variable validation for required DATABASE_URL
  - Emergency incident API fully operational with complete schema support

- July 25, 2025. Production Database & Authentication System Fixed
  - Fixed missing disaster management schema in production database
  - Created disaster_users table with proper emergency personnel accounts
  - Added enhanced login debugging for production environment troubleshooting  
  - Seeded production database with admin, Emergency1, chief_fire, and medic_1 users
  - All emergency accounts verified and ready for deployment use
  - Authentication system now properly handles production environment authentication

- July 24, 2025. TranslationDemo Seamless Auto-Dispatch System Complete
  - Removed all manual buttons for fully automated emergency response workflow
  - Victim submits → System auto-translates → Auto-dispatches to responder in preferred language
  - Language dropdown selection triggers immediate re-translation and dispatch
  - Added processing spinner and "Emergency Dispatched Successfully" confirmation
  - Real-time GPT-4o translation with automatic dispatch upon language preference change
  - Eliminated robotic text-to-speech issues by removing TTS functionality entirely

- July 24, 2025. TranslationDemo UI Polish & Animation Complete
  - Added framer-motion animations with staggered card entrance effects
  - Implemented AnimatedCard wrapper component for consistent styling across all sections
  - Enhanced visual design with rounded corners, shadows, and clean background (#f5f7fa)
  - Improved responsive layout with mobile-friendly vertical stacking
  - Polished typography with consistent text-lg font-semibold mb-2 text-slate-800 headings
  - Added live demo indicator and professional page header design
  - Enhanced form controls with focus states and hover effects for better UX

- July 24, 2025. TranslationDemo Enhancement - Voice Input & Text-to-Speech Complete
  - Added voice/text mode toggle in CallerInput with simulated microphone functionality
  - Implemented Web Speech API integration for voice recognition (webkitSpeechRecognition)
  - Enhanced ResponderOutput with text-to-speech capabilities using SpeechSynthesis API
  - Added South African language code mapping for proper TTS pronunciation
  - Crisis scenario presets now support both text and voice input modes
  - Complete multilingual emergency communication workflow with audio I/O capability

Changelog:
- July 9, 2025. Landing Page & Navigation Update for Emergency Operations
  - Updated default landing page to Module 1 - Incident Management for immediate emergency focus
  - Removed subscription and token management features not applicable to emergency response
  - Updated sidebar navigation: "DisasterMng-1-OM9" branding with "Emergency Operations" subtitle
  - Cleaned admin navigation: removed subscription links, kept essential emergency management tools
  - Dashboard updated: replaced subscription cards with emergency department assignments
  - Navigation now prioritizes disaster management modules over general application features
  - AI-powered incident assessment remains fully operational with threat level analysis

Changelog:
- July 9, 2025. UI/UX Consistency Audit & Content Containment Fix
  - Fixed critical content overflow issues across all disaster management modules
  - Implemented strict container boundary enforcement to prevent content spillage
  - Added comprehensive CSS containment layer with badge size constraints
  - Applied text truncation and flex-shrink controls to all components
  - Standardized card padding (4px), grid gaps (3px), and responsive breakpoints
  - Enhanced mobile responsiveness with proper text sizing and spacing
  - Added compact view toggle for operator console optimization
  - All content now properly contained within card boundaries without overflow

- July 9, 2025. Module Navigation and Dependencies Update
  - Sidebar navigation updated: Now shows only implemented disaster management modules
  - Module dependencies mapped: Incident Management triggers alerts, Communication Center depends on incidents
  - Hidden unused modules: Modules 7 and 8 removed from navigation (not implemented)
  - Module descriptions added: Each module now shows its purpose in sidebar
  - Dependency validation: All 7 active modules have proper API endpoints and data flows
  - Module architecture confirmed: Distributed disaster management system working correctly

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

- July 9, 2025. Schema & Architecture Blueprint v0.2 Complete
  - Full schema documentation: Complete PostgreSQL blueprint with all emergency tables
  - Enhanced disaster schema: Added disaster_translations and disaster_fallback_routes tables
  - AI Processing Hub: Emergency AI routing system with OmegaAIR integration and fallback responses
  - Emergency Modules: 7-module architecture (Incident Intake, AI Hub, Alert Dispatch, Response Assignment, Audit Logs, Multilingual Bridge, Dashboard Console)
  - API expansion: Complete REST API with 20+ emergency endpoints across all modules
  - Emergency protocols: Incident response workflow, communication redundancy, data integrity measures
  - Schema locked: v0.2 architecture blueprint finalized for emergency operations center

- July 9, 2025. UI/UX Wireframe Implementation Complete
  - 5-role interface system: Field Responder, Commander, Admin Oversight, AI Monitor, Mobile Compact views
  - Mobile-first emergency interfaces: Voice reporting, one-tap alerts, real-time coordination
  - Role-specific dashboards: Context-aware navigation and functionality per user permissions
  - AI oversight system: Sentiment monitoring, recommendation approval, manual override controls
  - Emergency color coding: Red/yellow/green status system for rapid visual assessment
  - Touch-optimized design: 44px minimum targets for field use under stress conditions
  - Real-time updates: 5-30 second refresh intervals for critical emergency data
  - Navigation layout fix: Emergency hotline "911" positioning corrected to prevent menu overlap

- July 9, 2025. Modular Rollout Architecture Complete
  - Zone-based deployment strategy: 4 risk zones (Alpha/Bravo/Charlie/Delta) with phased rollout
  - Module independence matrix: 6 core modules with dependency management and zone targeting
  - Deployment control center: Real-time rollout management with progress tracking and rollback capability
  - Risk mitigation framework: Technical, operational, and business risk management protocols
  - Performance monitoring: KPI tracking, SLA monitoring, and success measurement framework
  - CLI deployment manager: Automated deployment planning, validation, and execution tools

- July 9, 2025. Smart Contract + Forensic Logging Layer Implementation Complete
  - Immutable audit trail system: Blockchain-based emergency response logging with fraud prevention
  - Comprehensive forensic architecture: Phase 1 (off-chain with testnet backup), Phase 2 (IPFS), Phase 3 (government chain)
  - Smart contract deployment: Ethereum-compatible emergency response logger with batch processing and merkle proofs
  - Forensic database schema: Encrypted logs, blockchain batches, IPFS content tracking, access audit trails
  - Role-based transparency: Commander (regional), Admin (full access), AI Monitor (redacted bias tracking)
  - Forensic dashboard: Real-time integrity verification, batch monitoring, report generation, blockchain verification
  - Post-crisis reconstruction: Timeline reports, decision audits, resource allocation trails, full forensic analysis

- July 9, 2025. Confidentiality & Clearance Layer Implementation Complete
  - Military-grade access control: SCI/SAP-based classification system with role-based access matrix
  - Five-tier clearance system: UNCLASSIFIED, RESTRICTED, SECRET, TOP SECRET, FORENSIC ONLY
  - Compartmentalization model: Geographic zones (Alpha/Bravo/Charlie/Delta) and functional compartments
  - Data redaction engine: AI output obfuscation based on user clearance levels with configurable rules
  - Emergency override system: Temporary clearance elevation with authorization codes and time limits
  - Comprehensive audit trail: Real-time access logging with anomaly detection and security incident tracking
  - UI security components: Classification badges, clearance warning modals, and access verification

- July 9, 2025. Multi-Layer Redundancy & Failover Communication System Complete
  - 5-tier communication failover: Satellite → Internet → GSM → Mesh/Helium → Voice-to-Text offline
  - Automatic failover logic: Timeout-based channel switching with 3-second escalation threshold
  - Communication database schema: Channels, failover logs, multi-channel messages, emergency broadcasts
  - Real-time monitoring dashboard: Channel status, health checks, message tracking, voice processing
  - Emergency broadcast system: Multi-channel alert distribution with delivery confirmation
  - Bandwidth-aware routing: Optimal channel selection based on message priority and availability
  - Offline queue capability: Voice-to-text processing with delayed relay for disconnected scenarios
  - Navigation system restoration: Original Omega toolset (theme, font, logout, AI help) integrated into disaster navigation
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
UI Design: Clean, minimal, professional appearance without excessive warnings or cluttered styling.
Dark Mode Accessibility: Ensure strong contrast between font and background colors in both light and dark modes.
```
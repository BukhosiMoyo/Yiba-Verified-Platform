\# Environment Setup

\*\*Project:\*\* Yiba Wise -- Compliance & QCTO Oversight App

\*\*Document:\*\* Environment-Setup.md

\*\*Version:\*\* v1.0

\*\*Date:\*\* 2026-01-14

\*\*Location:\*\* 06-Development/

\*\*Status:\*\* Approved -- Required before development

\-\--

\## 1. Purpose

This document defines the \*\*technical environment, stack decisions,
and setup steps\*\* for Version 1 (V1) of the Compliance & QCTO
Oversight App.

It ensures:

\- Consistent development environments

\- Predictable deployments

\- Secure handling of learner and institutional data

\- Alignment with audit and compliance requirements

No development should begin until this setup is agreed and followed.

\-\--

\## 2. Architecture Overview

The system follows a \*\*modular web application architecture\*\*:

\- Frontend: Web App (role-based dashboards)

\- Backend: API-first architecture

\- Database: Relational (compliance + audit-friendly)

\- File Storage: Versioned object storage

\- Auth: Token-based (JWT)

\- Audit: Transactional, database-enforced

\-\--

\## 3. Recommended Technology Stack (V1)

\### 3.1 Frontend

\- Framework: \*\*React / Next.js\*\*

\- Styling: Tailwind CSS

\- State Management: React Query / TanStack Query

\- Forms: React Hook Form + Zod

\- Auth Handling: JWT stored securely (HTTP-only cookies preferred)

\### 3.2 Backend

\- Runtime: \*\*Node.js (LTS)\*\*

\- Framework: \*\*NestJS\*\* or Express (NestJS preferred for structure)

\- API Style: REST (V1), OpenAPI-ready

\- Validation: Zod / Joi

\- RBAC Middleware: Custom (role + institution scope)

\### 3.3 Database

\- Engine: \*\*PostgreSQL\*\*

\- ORM: Prisma / TypeORM

\- Migrations: Versioned, mandatory

\- Soft Deletes: Used where applicable (never hard delete compliance
data)

\### 3.4 File Storage

\- Storage: S3-compatible (AWS S3 / MinIO)

\- Versioning: Enabled at storage + app level

\- Allowed Types: PDF, DOCX, XLSX, JPG, PNG

\- Max File Size: 10--20MB (configurable)

\-\--

\## 4. Repository Structure (Suggested)

/apps  
/api \# Backend API  
/web \# Frontend app

/packages  
/shared \# Shared types, enums, constants

/docs  
/wireframes  
/data  
/development

/scripts  
/migrations  
/seed

\-\--

\## 5. Environment Variables

\### 5.1 Backend (.env)

NODE_ENV=development  
PORT=4000

DATABASE_URL=postgresql://user:password@localhost:5432/yibawise

JWT_SECRET=\*\*\*\*\*\*\*\*  
JWT_EXPIRES_IN=15m  
REFRESH_TOKEN_SECRET=\*\*\*\*\*\*\*\*  
REFRESH_TOKEN_EXPIRES_IN=7d

STORAGE_PROVIDER=s3  
S3_BUCKET_NAME=yibawise-docs  
S3_REGION=af-south-1  
S3_ACCESS_KEY=\*\*\*\*\*\*\*\*  
S3_SECRET_KEY=\*\*\*\*\*\*\*\*

AUDIT_LOG_ENABLED=true

\### 5.2 Frontend (.env)

NEXT_PUBLIC_API_BASE_URL=[[http://localhost:4000/api/v1]{.underline}](http://localhost:4000/api/v1)

\-\--

\## 6. Authentication & Authorization

\### 6.1 Auth Model

\- JWT access tokens

\- Optional refresh tokens

\- Role-based access control (RBAC)

\- Institution scoping enforced server-side

\### 6.2 Rules

\- Tokens required for all non-public endpoints

\- Role + institution scope checked on every request

\- QCTO users are read-only except review actions

\- Students restricted to self-access only

\-\--

\## 7. Audit Logging (Critical)

\### 7.1 Implementation Rules

\- Audit log writes are \*\*transactional\*\*

\- If audit logging fails, the main operation must fail

\- All mutable endpoints must trigger audit entries

\- Audit data stored in a dedicated table/schema

\### 7.2 Protected at DB Level

\- No UPDATE or DELETE on audit tables

\- Read-only DB role for QCTO access (recommended)

\-\--

\## 8. Database Migrations & Seeding

\### 8.1 Migrations

\- Every schema change must be a migration

\- No direct DB edits

\- Migration files committed to repo

\### 8.2 Seed Data (Dev/Test)

\- Sample roles

\- Sample institutions

\- Sample QCTO users

\- Sample learners (fake data only)

\-\--

\## 9. Local Development Setup

\### 9.1 Prerequisites

\- Node.js LTS

\- PostgreSQL 14+

\- Git

\- Docker (optional but recommended)

\### 9.2 Steps

1\. Clone repository

2\. Create \`.env\` files

3\. Install dependencies

4\. Run migrations

5\. Seed database

6\. Start API

7\. Start frontend

\-\--

\## 10. Security & Compliance Considerations

\- POPIA compliance enforced at application level

\- No learner data accessible without consent

\- HTTPS required in all non-local environments

\- File access protected by signed URLs

\- Regular dependency updates

\-\--

\## 11. Environments

\| Environment \| Purpose \|

\|\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\--\|

\| Local \| Developer machines \|

\| Dev \| Shared development \|

\| Staging \| Pre-production testing \|

\| Production \| Live system \|

\-\--

\## 12. Logging & Monitoring (V1 Basic)

\- API request logging

\- Error logging

\- Audit logs as primary compliance trail

\- Performance monitoring (basic)

\-\--

\## 13. Out-of-Scope (V1)

\- Mobile apps

\- Offline mode

\- Advanced analytics

\- SMS / 2FA enforcement

\- External system integrations

\-\--

\## 14. Next Steps

This document enables:

\- Backend scaffolding

\- Frontend shell creation

\- CI/CD planning

Next recommended document:

👉 \*\*Form5-Readiness-Wireframe.md\*\*

\-\--

\*\*End of Document\*\*

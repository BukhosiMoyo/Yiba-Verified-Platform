\# Yiba Wise – Compliance & QCTO Oversight Platform

This repository contains a regulator-grade LMS-adjacent compliance platform  
integrating with Tutor LMS for learning delivery.

\#\# Core Concepts  
\- Tutor LMS handles learning content only  
\- This system handles compliance, readiness, learners, evidence, and audits  
\- QCTO has read-only oversight and review authority  
\- Institutions manage their own data only  
\- All changes are audited and immutable

\#\# Documentation Map  
\- Strategy & vision: /docs/01-Strategy  
\- Requirements & rules: /docs/02-Requirements  
\- Screen intent & flows: /docs/03-Wireframes  
\- Data & audit rules: /docs/04-Data  
\- UI & layout rules: /docs/05-Design  
\- API & dev contracts: /docs/06-Development  
\- Governance policies: /docs/08-Governance

\#\# Non-Negotiable Rules  
\- Enforce RBAC on every endpoint  
\- All mutations must create audit logs  
\- No hard deletes for compliance data  
\- QCTO users are read-only reviewers  
\- Follow Validation-Rules.md strictly

Use the documentation files as the source of truth.  
Do not invent behaviour not specified in docs.


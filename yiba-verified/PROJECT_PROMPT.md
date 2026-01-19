\# Yiba Verified – Main Project Prompt (Root)

You are working inside a repo for \*\*Yiba Verified\*\*, a compliance-grade, audit-first platform that supports:  
\- QCTO programme delivery readiness (Form 5\)  
\- Learner tracking (LMIS)  
\- Evidence Vault (versioned documents, never deleted)  
\- Oversight review (QCTO read-only \+ review/flag actions)  
\- Platform Admin ops monitoring (usage \+ security \+ audit)

\#\# Absolute Rules  
\- \*\*Markdown in /docs is the only source of truth.\*\*  
\- Any .xlsx/.docx/.pdf are \*\*reference-only\*\* unless a docs MD explicitly says otherwise.  
\- \*\*Deny-by-default RBAC.\*\*  
\- \*\*QCTO must never edit institution-submitted data\*\* (only review/flag/comment/recommend).  
\- \*\*No hard deletes\*\* for compliance entities. Evidence is \*\*versioned\*\*; audit logs are \*\*immutable\*\*.  
\- Every mutation must write an audit log entry.

\#\# Where requirements live  
\- Strategy: \`docs/01-Strategy/\`  
\- Requirements: \`docs/02-Requirements/\`  
\- Wireframes: \`docs/03-Wireframes/\`  
\- Data: \`docs/04-Data/\`  
\- Design: \`docs/05-Design/\`  
\- Development rules/specs: \`docs/06-Development/\`

\#\# Roles (canonical)  
\- PLATFORM\_ADMIN  
\- QCTO\_USER  
\- INSTITUTION\_ADMIN  
\- INSTITUTION\_STAFF  
\- STUDENT

\#\# Engineering Stack (default)  
\- Next.js (App Router) \+ TypeScript  
\- Tailwind \+ shadcn/ui  
\- Prisma \+ PostgreSQL  
\- NextAuth (Credentials now; Google OAuth later)  
\- Audit logging is first-class

\#\# Output expectations  
When asked to implement something:  
1\) confirm what docs govern it  
2\) implement smallest safe slice  
3\) keep UI consistent with shadcn/ui patterns  
4\) keep code clean, typed, and testable  

This repository is governed by PROJECT_PROMPT.md at the repo root.

Before writing, editing, or refactoring any code:
- Read PROJECT_PROMPT.md
- Treat it as mandatory system rules
- Follow it strictly
- If something is unclear or conflicts, ask before proceeding
- Never break `npm run dev`

## Guardrails for AI / Cursor

- Do not invent requirements
- Do not assume permissions not listed in docs
- Do not create new roles unless explicitly documented
- Prefer server-side enforcement over UI-only checks
- If a change affects RBAC, audit, or data models, explain impact before coding
- If unsure, ask first
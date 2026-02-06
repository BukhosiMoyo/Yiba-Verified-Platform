# AI Email System — Boundaries, Tone Rules, and Structured Output
## Scope: Institution Admin Invite (IMPLEMENT NOW) + QCTO/CETA Invite (SCHEMA ONLY, NOT ENABLED)

## 0) Goal
We want AI to generate high-converting, brand-consistent Institution Admin invite emails that:
- feel human, professional, and trustworthy
- clearly explain what YibaVerified/YibaWise is
- drive acceptance (primary CTA) + allow review (secondary CTA)
- never hallucinate actions, stats, endorsements, or compliance outcomes
- always return structured JSON we can safely render into our existing email template

This is ONLY for Institution Admin invites right now.

We also want to define (but not enable) a QCTO/CETA onboarding invite schema for future.

---

## 1) Hard Boundaries (Non-Negotiable)
### 1.1 The AI MUST NOT:
- claim it sent emails, created accounts, updated templates, verified domains, or changed settings unless the system truly did it
- invent endorsements (e.g., “QCTO approved this platform”)
- invent numbers (“thousands already onboarded”) unless provided as input
- expose secrets (keys, tokens, internal URLs, private admin pages)
- leak cross-tenant data (never reference other institutions or other users)
- guess missing details; must return NEEDS_INPUT if required fields are missing

### 1.2 The AI MAY:
- rewrite copy and improve clarity
- create subject lines + preview text
- choose best wording for benefits
- produce short A/B variants (optional)
- classify response buckets only if requested, using known enum values

---

## 2) Tone Contract (Global for all AI-generated emails)
- Professional, warm, confident (not hypey)
- Clear and scannable: short paragraphs, bullet benefits
- No “marketing spam” language; no pressure or guilt
- Always include:
  - why recipient is receiving this invite
  - what they can do next (accept / review)
  - support contact or help note
- Local-friendly English (South Africa audience), but avoid slang

### 2.1 Preview Text Rules (Open-rate boost)
- Must not repeat the subject
- 35–90 characters
- Should add a specific detail / benefit (“Review the workflow before accepting.”)

---

## 3) Invitation Rules by Role (IMPORTANT)
### 3.1 Institution Admin Invite (IMPLEMENT)
This email must include 2 CTAs:
- Primary CTA: “Accept Invitation” (goes to accept link)
- Secondary CTA: “Review Invitation” (goes to review walkthrough page)

Notes:
- Review flow is ONLY for Institution Admin invites (not Platform Admin).
- The email should briefly explain value, but the deep explanation is on Review page.

### 3.2 Platform Admin Invite (NOT IN THIS TASK)
No review invitation button.

### 3.3 QCTO/CETA invites (SCHEMA ONLY)
We are NOT automating QCTO/CETA outreach. We only keep schema ready for future.

---

## 4) Required Inputs for Institution Admin Invite Generation
When calling AI for Institution Admin invite, provide ONLY these safe fields:

Required:
- institution_name (string)
- recipient_name (string | null allowed)
- invited_role (must be "INSTITUTION_ADMIN")
- accept_url (string)
- review_url (string)
- support_email (string) e.g., support@yibaverified.co.za
- brand_name (string) e.g., "YibaVerified"
- product_short (string) e.g., "a secure platform that digitises readiness, learner management, attendance, and submissions for QCTO visibility."

Optional:
- province (string)
- sender_display_name (string) default "YibaVerified Team"
- primary_color_token (use existing email CSS tokens)
- logo_url (or CID reference if embedded)

Do NOT pass:
- other institutions data
- private/internal admin URLs
- any secrets

If required fields are missing, AI must return needs_input[] and produce no email copy.

---

## 5) Output Contract (STRICT JSON ONLY)
AI must output JSON that matches this schema exactly.
No markdown, no prose, no commentary.

### 5.1 JSON Schema: Institution Admin Invite
{
  "type": "INSTITUTION_ADMIN_INVITE",
  "version": "1.0",
  "needs_input": [],
  "subject": "string",
  "preview_text": "string",
  "headline": "string",
  "greeting": "string",
  "body_blocks": [
    "string"
  ],
  "benefits": [
    { "icon": "string", "text": "string" }
  ],
  "primary_cta": { "label": "string", "icon": "string", "url": "string" },
  "secondary_cta": { "label": "string", "icon": "string", "url": "string" },
  "support_line": "string",
  "footer_disclaimer": "string"
}

Rules:
- subject: <= 70 chars
- preview_text: 35–90 chars
- body_blocks: 2–4 short blocks max
- benefits: exactly 3–5 items, each short
- icons: use simple emoji codes or icon names (see emoji/icon guidance below)
- footer_disclaimer must include: “If you didn’t expect this invite, you can ignore this email.”

### 5.2 NEEDS_INPUT behavior
If any required input missing:
- Set needs_input to list of missing keys
- Set subject/preview/headline etc. to empty strings
- CTAs must be empty strings
- No hallucination / no best guesses

---

## 6) Emoji/Icon Guidance (for buttons + benefits)
We want clean “modern SaaS” feel; icons should be subtle, not childish.

Preferred icons (choose sparingly):
- "shield" (or 🛡️) for security/trust
- "check" (or ✅) for compliance/readiness
- "users" (or 👥) for learner management
- "calendar" (or 📅) for attendance
- "file" (or 📄) for documents/evidence
- "sparkles" (or ✨) for getting started

Button icon rules:
- Primary CTA: use ✅ or ✨
- Secondary CTA: use 👀 or 📄 (review)
- Never use more than 1 emoji per label.

If we adopt animated emojis later, keep the JSON as icon keys, and map them in the UI layer (do not embed heavy assets in email HTML).

---

## 7) Rendering Rules (Email HTML template expectations)
Update the existing email template renderer so it uses:
- fixed-width container max 640–720px (NOT full width)
- responsive padding 16–20px
- CTA buttons large (min 44px height), clear font size (16–18px)
- primary CTA filled, secondary CTA outlined
- include logo at top-left (or centered on mobile)
- ensure dark-mode safe colors (use existing tokens)

---

## 8) Implementation Tasks (AntiGravity To-Do)
### 8.1 Create AI policy + schema
- Create `src/lib/ai/policy.ts`:
  - boundary rules
  - tone contract
  - “needs_input” rule
- Create `src/lib/ai/schemas/institutionAdminInvite.schema.json` (or TS validator)
- Create `src/lib/ai/generateEmailCopy.ts`:
  - input validation
  - OpenAI call
  - output validation
  - return typed JSON
- Add `src/lib/ai/validators.ts` to enforce schema strictly

### 8.2 Integrate into Invite Email Pipeline
- In invite send flow for Institution Admin:
  - Build context object with required inputs
  - Call `generateEmailCopy(INSTITUTION_ADMIN_INVITE, context)`
  - If needs_input not empty: fallback to safe default template (non-AI)
  - Render output into existing HTML container

### 8.3 Logging (minimal + safe)
Store:
- template_type, version
- institution_id
- generated subject + preview_text
Do NOT store:
- secrets
- full email bodies if avoidable (or store hashed)

---

## 9) QCTO/CETA Invite (Schema Only — Do Not Enable)
We want a schema prepared, but NOT used in automation yet.

### 9.1 JSON Schema: QCTO_OR_SETA_INVITE (parked)
{
  "type": "QCTO_OR_SETA_INVITE",
  "version": "0.1",
  "needs_input": [],
  "subject": "string",
  "preview_text": "string",
  "headline": "string",
  "body_blocks": ["string"],
  "primary_cta": { "label": "string", "icon": "string", "url": "string" },
  "support_line": "string",
  "footer_disclaimer": "string"
}

Rules:
- No “Review Invitation” CTA in email (if later added, it’s a guided onboarding, not a review walkthrough)
- Messaging should be neutral: “You’ve been granted access to review institution submissions and requests.”

But again: DO NOT implement calls or UI for this yet.

---

## 10) Acceptance Criteria (Done = Done)
Institution Admin invites must:
- display in a centered container (not full width)
- include subject + preview text + improved body copy
- include 2 CTAs (Accept + Review)
- never show Review CTA for Platform Admin invites
- validate AI output before sending
- fallback gracefully if AI output invalid or needs_input is not empty

---

# Example Output JSON

```json
{
  "type": "INSTITUTION_ADMIN_INVITE",
  "version": "1.0",
  "needs_input": [],
  "subject": "You’ve been invited to manage your institution on YibaVerified",
  "preview_text": "Review how compliance, attendance and submissions are handled before you accept.",
  "headline": "You’re invited to manage your institution on YibaVerified",
  "greeting": "Hello {{recipient_name}},",
  "body_blocks": [
    "You’re receiving this invitation because your institution has been identified as part of South Africa’s accredited training ecosystem.",
    "YibaVerified is a secure platform that helps institutions manage learner data, attendance, evidence and submissions in a structured, system-based way — giving regulators real-time visibility without manual paperwork.",
    "You can review how the platform works before accepting, or get started immediately if you’re ready."
  ],
  "benefits": [
    {
      "icon": "check",
      "text": "Structured compliance without spreadsheets or email submissions"
    },
    {
      "icon": "calendar",
      "text": "Attendance registers that are auditable and export-ready"
    },
    {
      "icon": "file",
      "text": "Secure document and evidence management in one place"
    },
    {
      "icon": "shield",
      "text": "Clear visibility for QCTO without disrupting daily operations"
    }
  ],
  "primary_cta": {
    "label": "Accept Invitation",
    "icon": "check",
    "url": "{{accept_url}}"
  },
  "secondary_cta": {
    "label": "Review Invitation",
    "icon": "eye",
    "url": "{{review_url}}"
  },
  "support_line": "If you have any questions or need assistance, contact us at {{support_email}}.",
  "footer_disclaimer": "If you didn’t expect this invitation, you can safely ignore this email."
}
```

---

# YibaVerified — Engagement Intelligence Specs

(Platform Admin / Institution Admin Outreach)

⸻

1️⃣ Response Classification Logic

What happens after an institution receives an invite

1.1 Possible User Actions

Every invite recipient can only end up in one of these states:

Action	Classification	Description
Clicks Accept Invitation	ACCEPTED_DIRECT	Institution is ready to onboard
Clicks Review Invitation	REVIEW_STARTED	Institution wants to understand before committing
Completes Review + Accepts	REVIEW_COMPLETED_ACCEPTED	High-intent, educated user
Declines Invitation	DECLINED	Explicit rejection
Clicks link but exits early	ENGAGED_NO_DECISION	Interest but hesitation
Opens email only	OPENED_ONLY	Passive awareness
No open / no click	IGNORED	Unaware or low trust


⸻

1.2 System Actions Per Classification

ACCEPTED_DIRECT
	•	Redirect → Institution Onboarding
	•	Pre-fill:
	•	Institution name
	•	Email domain
	•	State → ONBOARDING_IN_PROGRESS
	•	Suppress all future outreach emails

REVIEW_STARTED
	•	Redirect → Review Walkthrough (read-only)
	•	Track:
	•	Screens viewed
	•	Time spent
	•	State → REVIEW_IN_PROGRESS

REVIEW_COMPLETED_ACCEPTED
	•	Redirect → Account Setup
	•	Tag as:
	•	HIGH_TRUST
	•	LOW_CHURN_RISK
	•	Prioritise for future features & beta access

DECLINED
	•	Show structured decline reasons:
	•	Not relevant now
	•	Already using another system
	•	Compliance handled manually
	•	Other (free text)
	•	Store decline metadata
	•	State → DECLINED
	•	Cooling period → 90 days (no emails)

ENGAGED_NO_DECISION
	•	Trigger soft follow-up after 5–7 days
	•	Email tone: helpful, non-pushy
	•	State → WARM_LEAD

OPENED_ONLY
	•	Send education-based follow-up
	•	Focus: problem framing, not product
	•	State → AWARE

IGNORED
	•	Re-enter awareness campaign later
	•	Different angle (risk, reputation, student trust)
	•	State → UNAWARE

⸻

2️⃣ Review Invitation Walkthrough Logic

Screens + copy (high-level)

Purpose

This is not onboarding.
It is trust-building + expectation-setting.

⸻

Screen 1: Welcome & Context

Title:

“Before you get started”

Copy:
“This short walkthrough shows how institutions use YibaVerified to manage compliance without spreadsheets, emails, or site-visit panic.”

CTA: Next

⸻

Screen 2: The Problem We Solve

Title:

“Why this system exists”

Copy points:
	•	Compliance requests arrive unexpectedly
	•	Evidence is scattered
	•	Attendance is hard to prove
	•	Students are exposed to risk

CTA: Next

⸻

Screen 3: How Institutions Use the Platform

Title:

“What changes for you”

Visual bullets:
	•	Attendance is marked daily
	•	Evidence is uploaded once
	•	Submissions are generated by the system
	•	QCTO visibility happens automatically

CTA: Next

⸻

Screen 4: What QCTO Sees (Important)

Title:

“What regulators can and cannot see”

Copy:
	•	QCTO does not access raw internal systems
	•	Only submitted or requested data is visible
	•	Every request is logged and auditable

CTA: Next

⸻

Screen 5: Your Control

Title:

“You stay in control”

Copy:
	•	You decide when to submit
	•	You approve every request
	•	You see deadlines before they expire

CTA: Accept Invitation | Exit for Now

⸻

3️⃣ AI Reply Behaviour (Objections Handling)

Rules for AI-generated responses

3.1 Hard Boundaries (Never Cross)

The AI must never:
	•	Pressure or threaten
	•	Claim government endorsement
	•	Promise accreditation approval
	•	Compare negatively by name
	•	Offer discounts or pricing

⸻

3.2 Tone Rules
	•	Calm
	•	Professional
	•	Human
	•	Respectful of hesitation
	•	South Africa context-aware

⸻

3.3 Objection → Response Pattern

Objection: “We already use another system”
AI Response Pattern:
	•	Acknowledge
	•	Position YibaVerified as complementary
	•	Emphasise regulator visibility

Objection: “We handle this manually”
	•	Validate current process
	•	Highlight risk & admin load
	•	Offer review, not conversion

Objection: “We’re not ready now”
	•	Respect timing
	•	Ask permission to follow up later
	•	No urgency language

⸻

3.4 AI Prompt Skeleton (Internal)

You are a compliance platform assistant.
Your goal is to inform, not convince.
Respond calmly.
Never promise outcomes.
Always respect timing and choice.


⸻

4️⃣ Engagement State Machine (Technical)

4.1 Core States

UNAWARE
  ↓
AWARE
  ↓
ENGAGED
  ↓
REVIEW_IN_PROGRESS
  ↓
ONBOARDING_IN_PROGRESS
  ↓
ACTIVE_INSTITUTION


⸻

4.2 Exit / Side States
	•	DECLINED
	•	WARM_LEAD
	•	INACTIVE
	•	ACTIVE_NO_SUBMISSIONS

⸻

4.3 Transition Rules
	•	Only one primary state at a time
	•	Transitions must be event-driven (click, submit, decline)
	•	Time-based transitions allowed (cooldowns)

⸻

4.4 Why This Matters

This allows:
	•	Clean analytics
	•	AI-safe behaviour
	•	No spam
	•	Clear reporting to QCTO (without exposing outreach mechanics)

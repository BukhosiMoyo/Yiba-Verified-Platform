# PROMPT 0 — SYSTEM CONTEXT & SCOPE DEFINITION
## Intelligent Institution Outreach Engine (YibaWise / YibaVerified)

## READ THIS CAREFULLY BEFORE DOING ANY WORK

You are NOT building a traditional email marketing system.

You are enhancing an existing email feature into a **relationship-driven, identity-aware, AI-assisted outreach engine** designed specifically for **South African accredited institutions**.

This system must feel:
- Human
- Slow
- Intentional
- Trust-first
- Non-salesy

If your assumptions lean toward:
- Bulk campaigns
- Funnels
- Aggressive automation
- “Marketing software” behaviour

❌ STOP and reset.

---

## SYSTEM CONTEXT

### What exists today
- Admin uploads a list of institution emails
- System sends emails
- Tracks clicks and acceptance
- Very limited logic
- No awareness stages
- No personalisation
- No journey visibility

This is NOT enough.

---

## WHAT WE ARE BUILDING INSTEAD

We are building an **Institution Relationship Engine**.

This engine:
- Treats each institution as a long-term relationship
- Tracks a full journey over time
- Responds based on behaviour and intent
- Uses AI ONLY after the institution engages
- Never pressures, never sells upfront

---

## TARGET USER (CRITICAL)

Primary target:
- **Institution Admins (SDPs / Colleges / Providers)**

Secondary (beneficiaries, not targets):
- QCTO
- CETAs
- Regulators

Important:
- Government bodies are NOT marketed to via this system
- QCTO engagement is handled manually and strategically
- This engine is for institutions only

---

## CORE PHILOSOPHY

We are NOT trying to “convert”.

We are trying to:
- Educate
- Build trust
- Reduce fear
- Increase clarity
- Create voluntary adoption

If institutions WANT to use the system,
compliance becomes automatic.

---

## NON-NEGOTIABLE RULES

1. No bulk-thinking  
   Every institution has its own journey.

2. No aggressive selling  
   Monetisation happens later, psychologically and ethically.

3. AI does NOT initiate conversations  
   AI only responds after a human action.

4. Identity is mandatory  
   Every click, page view, answer, and email must be tied to a unique institution identity.

5. Build incrementally  
   - Plan first  
   - Design second  
   - Implement third  
   - Test before moving on  

Do NOT build everything at once.

---

## WHAT YOU MUST DO NOW

Your task in THIS prompt is ONLY to:

1. Acknowledge understanding of the system goals
2. Restate the system in your own words (briefly)
3. Confirm that this is NOT an email marketing tool
4. Confirm that work will proceed **one stage at a time**
5. Wait for the next prompt

DO NOT:
- Design UI
- Create schemas
- Write copy
- Suggest tools
- Jump ahead

---

## EXPECTED OUTPUT FORMAT

Respond with:

- A short confirmation section
- A clear restatement of the system purpose
- Explicit confirmation that you will proceed step-by-step

Nothing else.

---

## WAIT FOR THE NEXT PROMPT

---

# PROMPT 1 — ENGAGEMENT STATES & RESPONSE CLASSIFICATION
## Intelligent Institution Outreach Engine (YibaWise / YibaVerified)

## PURPOSE OF THIS PROMPT

We are defining the **foundation logic** for how institutions are classified **after the first email is sent**.

This is NOT implementation yet.
This is **behaviour modelling**.

If this layer is wrong, everything breaks later.

---

## CORE CONCEPT

Each institution exists in **exactly one engagement state at a time**.

States change only through **explicit actions**, never assumptions.

Silence is a state.
Clicks are a state.
Declines are a state.
Replies are a state.

---

## BASE ENGAGEMENT STATES (V1 — DO NOT EXPAND YET)

You must define the following canonical states:

### STATE 0 — SEEDED
- Institution email exists in the system
- No email sent yet

---

### STATE 1 — CONTACTED
- First email sent
- No interaction yet
- Timer starts (used later for pacing)

---

### STATE 2 — OPENED
- Email opened
- No link clicked
- Indicates light curiosity, not intent

---

### STATE 3 — CLICKED
- Link clicked from email
- Identity confirmed via unique token
- This is the **first trust signal**

---

### STATE 4 — ENGAGED
- Institution interacts with a page
- Examples:
  - Answers at least one question
  - Proceeds past intro screen
- This is where AI MAY become active later

---

### STATE 5 — REVIEWING
- Institution is actively reading / stepping through value explanation
- No commitment yet
- This is an education phase, not onboarding

---

### STATE 6 — ACCEPTED
- Institution explicitly chooses to proceed
- This leads into onboarding flows (handled later)

---

### STATE 7 — DECLINED
- Institution explicitly declines
- Decline reason must be captured (structured)
- Optional free-text message allowed

---

### STATE 8 — INACTIVE
- No interaction after a defined cooling-off period
- NOT a rejection
- Eligible for future re-engagement

---

## RESPONSE CLASSIFICATION RULES

You must enforce the following:

1. **No implicit transitions**
   - Opens ≠ interest
   - Clicks ≠ acceptance

2. **Decline is explicit**
   - Decline must be a deliberate action
   - One reason only (radio select)
   - “Other” reveals a text field

3. **AI is locked until STATE 4**
   - Before that: static copy only
   - After that: AI may respond contextually

4. **Institutions can move backwards**
   - From REVIEWING → INACTIVE
   - From ENGAGED → REVIEWING
   - But never from DECLINED → ACTIVE automatically

---

## DATA THAT MUST BE RECORDED PER TRANSITION

For every state change, log:
- Institution ID
- Previous state
- New state
- Trigger action
- Timestamp
- Source (email, page, manual)

This is non-negotiable.

---

## WHAT YOU MUST DO NOW

Your task in THIS prompt is ONLY to:

1. Confirm these engagement states
2. Validate transitions between them
3. Flag edge cases or conflicts
4. Propose a clean internal naming convention (constants / enums)

DO NOT:
- Design UI
- Write copy
- Implement AI
- Suggest email content
- Jump to onboarding

---

## OUTPUT FORMAT REQUIRED

Respond with:
- Confirmation of state list
- Transition table (simple)
- Any risks you see
- A short “ready to proceed” note

---

## WAIT FOR THE NEXT PROMPT

---

# PROMPT 2 — REVIEW INVITATION WALKTHROUGH LOGIC
## Institution Education Layer (Pre-Onboarding)

## PURPOSE OF THIS PROMPT

We are defining the **Review Invitation experience**.

This is **NOT onboarding**.
This is **NOT account setup**.

This layer exists to:
- Build trust
- Educate
- Let institutions self-qualify
- Reduce fear before commitment

Institutions must feel informed, not sold.

---

## CORE PRINCIPLE

**Review ≠ Accept**

The review flow says:
“Understand what this system is, before you decide.”

---

## WHEN THIS FLOW IS TRIGGERED

This walkthrough is shown ONLY when:
- Institution is in STATE 3 (CLICKED)
- OR STATE 4 (ENGAGED)
- AND they choose **“Review Invitation”**

It must NEVER appear for:
- Platform admins
- Staff
- Students

---

## STRUCTURE OF THE REVIEW WALKTHROUGH

The review experience is:

- A **dedicated page**
- With a **centered modal / card**
- Surrounded by a neutral, branded background
- No dashboard visible
- No login UI reused

---

## WALKTHROUGH FORMAT

### CARD-BASED SEQUENCE

- Fixed-size cards
- One card in focus at a time
- Horizontal movement:
  - Next → slide left
  - Back → slide right
- Adjacent cards visible but blurred
- Progress indicator at top (pill-style, not dots)

NO auto-play  
NO timers  
User controls progression

---

## REQUIRED WALKTHROUGH STEPS (V1)

You must implement **exactly these steps** in this order:

### STEP 1 — Welcome & Context
- What YibaWise / YibaVerified is
- Who it is for
- Why it exists

Goal: Orientation, not persuasion

---

### STEP 2 — The Problem Being Solved
- Manual compliance pain
- Fragmentation
- Risk to institutions & students

Goal: “This feels familiar”

---

### STEP 3 — How the System Helps
- Live visibility
- Structured submissions
- Less admin burden

Goal: Reduce perceived workload

---

### STEP 4 — What Is Expected From the Institution
- Data that will be required
- Ongoing responsibilities
- Transparency expectations

Goal: No surprises later

---

### STEP 5 — Trust & Alignment
- QCTO alignment
- Auditability
- Neutral infrastructure stance

Goal: Credibility

---

### STEP 6 — Decision Point
Two primary actions:
- **Accept Invitation**
- **Decline Invitation**

Secondary:
- Back to previous step

---

## ACCEPT LOGIC

If user clicks **Accept Invitation**:
- Transition state → ACCEPTED
- Proceed to onboarding (handled later)
- No further review steps shown

---

## DECLINE LOGIC (MANDATORY)

If user clicks **Decline Invitation**:
- Show a secondary modal
- Emotional but respectful tone

### Decline modal must include:
- One selectable reason (radio):
  - Using another platform
  - Manual process works for us
  - Not ready right now
  - Not accredited
  - Other
- “Other” reveals a text field
- One reason only allowed
- Optional message

After submission:
- State → DECLINED
- Data stored for analytics & future re-engagement
- User exits flow gracefully

---

## DATA TO RECORD

For the review walkthrough, record:
- Step completion
- Time spent per step
- Final action (accept / decline)
- Decline reason (if applicable)

---

## WHAT YOU MUST DO NOW

In this prompt, you must:

1. Validate the step order
2. Confirm accept vs review separation
3. Identify UX or logic risks
4. Suggest internal structure for storing walkthrough progress

DO NOT:
- Write final copy
- Design animations
- Implement onboarding
- Merge this with login flows

---

## WAIT FOR THE NEXT PROMPT

---

# PROMPT 3 — AI Objection Handling Rules (Gold Standard)

## Objective
Design and implement **AI-assisted objection handling** for Institution Admin outreach in a way that feels:
- Human
- Respectful
- Non-salesy
- Trust-building
- Safe for government-adjacent communication

This AI is **not a salesperson**.
It is a **patient guide and listener**.

---

## 1️⃣ When AI Is Allowed to Respond

AI responses are ONLY triggered when:
- An institution **actively responds** (via email reply or in-platform message)
- An institution selects **“Other”** and types a message
- An institution explicitly raises a concern or objection

AI must NEVER:
- Chase ignored users aggressively
- Invent urgency
- Apply pressure
- Pretend to be a human individual

---

## 2️⃣ Objection Classification (Required)

Every inbound message MUST first be classified into **one and only one** category:

### Objection Types
1. **Using Another Platform**
2. **Manual Process Is Working**
3. **Too Busy / Not Now**
4. **Don’t Understand the System**
5. **Concern About Cost**
6. **Concern About Data / Trust**
7. **Already Working With QCTO**
8. **General Skepticism**
9. **Positive but Not Ready**
10. **Hard Rejection**
11. **Other (Free Text)**

Classification must be stored in the database:
- objection_type
- original_message
- timestamp

---

## 3️⃣ AI Response Rules (Hard Constraints)

AI responses MUST:

✅ Acknowledge the concern  
✅ Reflect the user’s words back  
✅ Provide clarity, not persuasion  
✅ Offer ONE optional next step  
✅ Allow exit at any time  

AI responses MUST NOT:

❌ Sell  
❌ Promise outcomes  
❌ Mention pricing  
❌ Mention competitors negatively  
❌ Argue  
❌ Over-explain  
❌ Sound scripted  

---

## 4️⃣ Tone & Voice Rules

The AI voice must feel like:
- A calm platform representative
- Neutral, professional, warm
- Respectful of institutional autonomy

Tone characteristics:
- Plain language
- Short paragraphs
- No emojis
- No hype
- No buzzwords

Example tone reference:
> “Thanks for sharing that — it helps us understand where you’re coming from.”

---

## 5️⃣ Example Objection → Response Patterns

### Objection: “We already use another system”
AI Response Pattern:
- Acknowledge existing setup
- Clarify this platform does not replace immediately
- Offer optional comparison walkthrough
- Exit gracefully

### Objection: “Manual works for us”
AI Response Pattern:
- Respect their process
- Highlight visibility, not replacement
- Offer review-only walkthrough
- No urgency

### Objection: “We’re too busy”
AI Response Pattern:
- Validate time pressure
- Offer pause / reminder option
- Ask preferred timing
- Stop if no reply

---

## 6️⃣ Escalation Rules (Very Important)

AI must STOP responding when:
- User says “Not interested”
- User says “Please stop”
- User does not respond after 2 AI replies

When escalation is required:
- Flag conversation for human review
- Do NOT continue automated messaging

---

## 7️⃣ Memory & Context Rules

AI is allowed to remember:
- Objection category
- Engagement stage
- Last interaction date

AI is NOT allowed to:
- Assume intent
- Change tone based on guesses
- Refer to internal scores or rankings

---

## 8️⃣ Success Criteria

This system is successful if:
- Institutions feel respected
- Responses feel tailored
- No complaints of spam or pressure
- Engagement continues voluntarily

---

## 9️⃣ Non-Goal (Explicit)

This AI is NOT designed to:
- Close deals
- Push sign-ups
- Replace human outreach
- “Convert” unwilling institutions

Its job is to:
> Reduce friction, increase clarity, and preserve trust.

---

## 10️⃣ Implementation Notes

- Implement classification BEFORE response generation
- Store all objection data for analytics
- Keep prompts versioned and auditable
- Allow manual override by Platform Admin

---

# PROMPT 4 — Engagement State Machine (Technical)

## Objective
Design a **deterministic, auditable engagement state machine** that governs how institutions move through awareness, trust, onboarding, and activation — without randomness, pressure, or spam behavior.

This state machine is the **single source of truth** for:
- What message is allowed
- When it is allowed
- Why it is allowed
- What happens next

---

## 1️⃣ Core Principle

Institutions never “fall through cracks”  
and are never “chased blindly”.

Every institution is always in **exactly one state**.

---

## 2️⃣ Primary Engagement States (Top Level)

Each institution must belong to ONE of the following:

1. `UNCONTACTED`
2. `CONTACTED_AWARENESS`
3. `ENGAGED_DISCOVERY`
4. `ENGAGED_REVIEW`
5. `ONBOARDING_STARTED`
6. `ONBOARDING_COMPLETED`
7. `ACTIVE_USER`
8. `PAUSED`
9. `DECLINED`
10. `DO_NOT_CONTACT`

---

## 3️⃣ State Definitions & Entry Conditions

### 1. UNCONTACTED
- Institution exists in database
- No emails sent

➡ Entry: Seed list import  
➡ Exit: First outreach email sent

---

### 2. CONTACTED_AWARENESS
- First email delivered
- No interaction yet

➡ Entry: Email sent  
➡ Exit:
- Link click
- Explicit reply
- Time-based progression (optional, slow)

---

### 3. ENGAGED_DISCOVERY
- Institution clicked link
- Viewed content
- Answered initial questions

➡ Entry: Landing page interaction  
➡ Exit:
- Review invitation clicked
- Objection submitted
- No response → PAUSED

---

### 4. ENGAGED_REVIEW
- Institution chose “Review Invitation”
- Walkthrough viewed

➡ Entry: Review flow started  
➡ Exit:
- Accept invitation
- Decline invitation

---

### 5. ONBOARDING_STARTED
- Invitation accepted
- Account created
- Setup not completed

➡ Entry: Account creation  
➡ Exit:
- Setup completed
- Abandoned → PAUSED

---

### 6. ONBOARDING_COMPLETED
- Institution profile completed
- Ready for system usage

➡ Entry: Final onboarding step  
➡ Exit: First operational action

---

### 7. ACTIVE_USER
- Using LMIS / submissions / attendance

➡ Entry: First real action  
➡ Exit:
- Long inactivity → PAUSED
- Explicit exit → DECLINED

---

### 8. PAUSED
- Temporarily inactive
- No pressure allowed

➡ Entry:
- “Not now”
- No response
- Time-based cooldown

➡ Exit:
- Manual re-engagement
- User-initiated action

---

### 9. DECLINED
- Explicit rejection
- Reason recorded

➡ Entry: Decline action  
➡ Exit: Human-approved re-engagement only

---

### 10. DO_NOT_CONTACT
- Legal or explicit opt-out

➡ Entry: Opt-out  
➡ Exit: NEVER (hard stop)

---

## 4️⃣ Allowed Transitions (Hard Rules)

- States may only change via:
  - User action
  - Explicit system event
  - Manual admin override

❌ No automatic skipping  
❌ No looping without consent  
❌ No silent reactivation  

---

## 5️⃣ Event → State Mapping

| Event | State Change |
|-----|-------------|
Email Sent | UNCONTACTED → CONTACTED_AWARENESS |
Link Click | CONTACTED → ENGAGED_DISCOVERY |
Review Click | ENGAGED_DISCOVERY → ENGAGED_REVIEW |
Accept Invite | ENGAGED_REVIEW → ONBOARDING_STARTED |
Complete Setup | ONBOARDING_STARTED → ONBOARDING_COMPLETED |
First Use | ONBOARDING_COMPLETED → ACTIVE_USER |
No Response | Any → PAUSED |
Explicit Decline | Any → DECLINED |
Opt-Out | Any → DO_NOT_CONTACT |

---

## 6️⃣ Technical Requirements

- Store state in DB (single column)
- Store transition history (audit table)
- Enforce transitions in backend (not UI)
- Block invalid transitions
- Log every state change with:
  - from_state
  - to_state
  - reason
  - timestamp
  - actor (system / user / admin)

---

## 7️⃣ Why This Matters

This prevents:
- Spam
- Confusion
- Trust erosion
- “Why am I getting this email?” moments

This enables:
- Clear analytics
- Predictable behavior
- Ethical growth
- Government-grade accountability

---

## 8️⃣ Non-Goals

This is NOT:
- A marketing automation engine
- A funnel spam system
- A sales CRM clone

It is a **trust-based engagement controller**.

---

## 9️⃣ Success Criteria

- Every institution’s journey is explainable
- No message is sent “by accident”
- Platform admins can answer:
  “Why did this institution receive this message?”

---

## 10️⃣ Next Prompt Dependency

This state machine is REQUIRED before:
- AI email generation
- Scoring systems
- Automation rules
- Dashboard analytics

---

# PROMPT 5 — Review Invitation Walkthrough (UX + Logic)

## Objective
Design a **non-salesy, trust-first Review Invitation experience** for **Institution Admins only**, allowing them to *understand value before committing*, without forcing account creation.

This is NOT onboarding.
This is NOT registration.
This is a **guided understanding layer**.

---

## 1️⃣ Who This Is For (Hard Rule)

✅ Institution Admins  
❌ Platform Admins  
❌ QCTO Users  
❌ Staff / Students  

Only Institution Admins may see the **Review Invitation** option.

---

## 2️⃣ Entry Conditions

The Review Invitation walkthrough is accessible ONLY when:

- Institution is in `ENGAGED_DISCOVERY`
- User clicks **“Review Invitation”** from email or landing page
- A valid invite token exists

❌ Direct URL access without token is blocked  
❌ Logged-in users do NOT see this flow again  

---

## 3️⃣ UX Structure (High Level)

This is a **standalone full-page experience**, NOT reused login UI.

### Visual Structure
- Blurred, animated background (subtle motion)
- Centered floating card
- Fixed-width card (desktop & mobile safe)
- Step-based progression
- No auto-advance
- Explicit user control

---

## 4️⃣ Walkthrough Steps (Content Logic)

### STEP 1 — Welcome & Context
**Purpose:** Reduce anxiety, set tone

Content:
- Welcome to YibaWise / YibaVerified
- Why institutions are being invited
- Alignment with QCTO (non-commercial tone)

CTA:
- `Next`
- `Decline Invitation`

---

### STEP 2 — The Problem We Solve
**Purpose:** Problem-aware positioning

Content:
- Manual compliance is risky
- CSVs, emails, site visits
- No live visibility
- High admin burden

CTA:
- `Next`
- `Back`

---

### STEP 3 — What This Platform Changes
**Purpose:** Value clarity

Content:
- Live compliance visibility
- Attendance & submissions generated from system data
- Reduced audit stress
- One source of truth

CTA:
- `Next`
- `Back`

---

### STEP 4 — What You Control
**Purpose:** Remove fear of loss of control

Content:
- You own your data
- You decide what is submitted
- Nothing is auto-sent without approval
- QCTO visibility is transparent

CTA:
- `Next`
- `Back`

---

### STEP 5 — What Happens If You Join
**Purpose:** Set expectations

Content:
- Short onboarding
- Profile setup
- Start using LMIS features
- No payment required

CTA:
- `Accept Invitation`
- `Back`

---

### STEP 6 — Accept or Decline
**Purpose:** Explicit choice

Buttons:
- `Accept Invitation` (Primary)
- `Decline Invitation` (Secondary)

---

## 5️⃣ Decline Flow (Mandatory)

If **Decline Invitation** is clicked:

### Decline Modal
- Friendly tone
- Sad/empathetic animated emoji
- Single-select reason (required)

Reasons:
- Using another system
- Not ready right now
- Manual process preferred
- Not relevant
- Other (shows message input)

Rules:
- Only ONE reason selectable
- “Other” reveals text area
- Submission required to proceed

Data Stored:
- Decline reason
- Optional message
- Timestamp
- Invite token reference

---

## 6️⃣ Outcomes & State Transitions

| Action | State Change |
|-----|-------------|
Accept Invitation | → ONBOARDING_STARTED |
Decline Invitation | → DECLINED |
Exit / Close | → PAUSED |

---

## 7️⃣ Technical Requirements

- Step index stored client-side
- Final action stored server-side
- Progress indicators (pill-style)
- Back button always available (except step 1)
- Fully responsive
- Light & dark mode supported

---

## 8️⃣ Non-Goals

This walkthrough must NOT:
- Ask for credentials
- Ask for documents
- Ask for compliance data
- Contain pricing
- Feel like marketing

---

## 9️⃣ Success Criteria

- Institutions feel informed, not pressured
- Declines provide insight (not silence)
- Acceptances are intentional
- Trust is built before commitment

---

## 10️⃣ Dependency

This flow depends on:
- Engagement State Machine (PROMPT 4)

Next steps after this:
- AI objection handling
- Email reply behavior
- Scoring logic

---

# PROMPT 6 — AI Reply Behavior & Objection Handling (Institution Admins)

## Objective
Define **strict AI behavior rules** for responding to Institution Admins **after engagement**, ensuring replies feel human, contextual, respectful, and never salesy.

This AI does NOT sell.
This AI guides, clarifies, reassures, and listens.

---

## 1️⃣ When AI Is Allowed to Respond

AI-generated replies are allowed ONLY when:

- Institution has interacted (clicked / answered / declined / replied)
- Engagement state is NOT `UNCONTACTED`
- A human-style reply is appropriate

AI must NEVER initiate first contact.

---

## 2️⃣ AI Identity & Tone Rules

### Identity
- AI speaks **as the platform team**, not “an AI”
- No technical jargon
- No marketing language
- Calm, respectful, professional

### Tone
- Conversational
- Empathetic
- Short, clear paragraphs
- No hype, no urgency pressure

❌ No “Don’t miss out”
❌ No “Limited time”
❌ No sales CTAs

---

## 3️⃣ Response Classification (Input Types)

AI must classify responses into ONE category before replying:

### A. Curious / Neutral
Examples:
- “This looks interesting”
- “Can you explain more?”
- “How does this work?”

### B. Objection-Based
Examples:
- “We already use another system”
- “We prefer manual processes”
- “This looks complicated”

### C. Timing-Based
Examples:
- “Not now”
- “Maybe later this year”
- “We’re busy at the moment”

### D. Trust-Based
Examples:
- “Is this endorsed by QCTO?”
- “Is our data safe?”
- “Who owns the data?”

### E. Decline / Closed
Examples:
- Explicit rejection
- Negative sentiment

---

## 4️⃣ Response Strategy Per Category

### A. Curious / Neutral
Goal: Educate gently

Response Rules:
- Answer only what was asked
- Invite review invitation if not completed
- No next-step pressure

---

### B. Objection-Based
Goal: Reframe without arguing

Rules:
- Acknowledge first
- Do NOT contradict
- Explain how system coexists, not replaces
- Offer comparison without attacking alternatives

---

### C. Timing-Based
Goal: Respect autonomy

Rules:
- Thank them
- Ask permission to follow up later
- No immediate CTA
- Move state to `PAUSED`

---

### D. Trust-Based
Goal: Build confidence

Rules:
- Reference transparency
- Mention alignment (not endorsement)
- Explain data ownership clearly
- Keep it factual

---

### E. Decline / Closed
Goal: Exit gracefully

Rules:
- Thank them
- Confirm no further emails
- Keep door open
- Move state to `DECLINED`

---

## 5️⃣ Hard Boundaries (Must Never Happen)

AI must NEVER:
- Mention pricing
- Mention competitors by name
- Argue with objections
- Push onboarding
- Ask for documents
- Ask for credentials

---

## 6️⃣ Personalisation Rules

AI may use:
- Institution name
- Previous answers
- Stated concerns

AI may NOT infer:
- Financial capacity
- Compliance risk
- Intent to join

---

## 7️⃣ Memory & Context Handling

For each institution, store:
- Last interaction
- Objection category
- Last response summary
- Engagement state

AI must reference ONLY stored facts.

---

## 8️⃣ Escalation Rules

If:
- Response is unclear
- Message is emotional
- Message is complex

Then:
- Flag for human review
- Do NOT auto-reply

---

## 9️⃣ Success Criteria

- Replies feel written by a thoughtful human
- Institutions feel heard
- No pressure is applied
- Trust increases over time

---

## 10️⃣ Dependency

Depends on:
- Engagement State Machine
- Review Invitation logic
- Email routing system

Next prompt will define:
- Engagement state transitions (technical)

---

# PROMPT 7 — Engagement State Machine (Technical Source of Truth)

## Objective
Define a **deterministic engagement state machine** for Institution Admin outreach.
This state machine controls:
- Which emails can be sent
- When AI may respond
- Which UI flows are unlocked
- What follow-ups are allowed

This is the **single source of truth** for engagement logic.

---

## 1️⃣ Core Principle

An institution is ALWAYS in exactly **one state**.

State changes only occur via:
- Explicit user action
- Time-based rules
- Admin override

No state skipping.
No ambiguous states.

---

## 2️⃣ Engagement States (Canonical List)

### STATE 0 — UNCONTACTED
- Institution exists in database
- No communication sent

Allowed Actions:
- Send first awareness email

Disallowed:
- AI replies
- Follow-ups
- Review invitation

---

### STATE 1 — CONTACTED
- First email sent
- No interaction yet

Allowed:
- Track open / click
- Passive analytics only

Transitions:
- Click → ENGAGED
- No action (X days) → DORMANT

---

### STATE 2 — ENGAGED
- Link clicked OR email replied
- No decision made yet

Allowed:
- Show landing page
- Ask lightweight questions
- AI reply allowed

Transitions:
- Answers submitted → EVALUATING
- Explicit decline → DECLINED
- No activity (X days) → PAUSED

---

### STATE 3 — EVALUATING
- Institution answering questions
- Reviewing content
- Reading walkthroughs

Allowed:
- Review Invitation walkthrough
- AI clarification replies
- Educational follow-ups

Transitions:
- Review completed → READY
- Decline → DECLINED
- Time delay → PAUSED

---

### STATE 4 — READY
- Institution shows intent
- Clicked “Access Dashboard” OR completed review

Allowed:
- Account activation
- Password setup
- Onboarding start

Transitions:
- Onboarding completed → ACTIVE
- Abandon → PAUSED

---

### STATE 5 — ACTIVE
- Institution admin account live
- Using platform

Allowed:
- Operational emails
- System notifications
- No marketing emails

---

### STATE 6 — PAUSED
- Institution requested delay OR inactive

Allowed:
- Gentle check-in after cooldown
- No AI persuasion

Transitions:
- Re-engagement → ENGAGED
- No response (long term) → ARCHIVED

---

### STATE 7 — DECLINED
- Institution explicitly declined

Allowed:
- Confirmation email
- No further outreach

Hard Stop:
- No follow-ups
- No AI replies
- No re-entry unless manually reset

---

### STATE 8 — DORMANT
- Never engaged after contact
- Silent non-response

Allowed:
- One reactivation attempt after long delay

Transitions:
- Engagement → ENGAGED
- No response → ARCHIVED

---

### STATE 9 — ARCHIVED
- End of lifecycle

Allowed:
- None (read-only)

---

## 3️⃣ Transition Rules (Strict)

- States can only move forward or sideways (never backward)
- DECLINED and ARCHIVED are terminal
- ACTIVE is stable (marketing disabled)

---

## 4️⃣ Technical Requirements

Each institution must store:
- current_state
- last_state_change_at
- last_interaction_at
- last_email_sent_at

State changes must be:
- Logged
- Auditable
- Timestamped

---

## 5️⃣ Enforcement Rules

Before any action:
- Validate current state
- Validate allowed actions for that state

If invalid:
- Block action
- Log violation

---

## 6️⃣ Why This Matters

This prevents:
- Spam
- Conflicting messages
- Over-automation
- Trust erosion

This enables:
- Predictable behavior
- Safe AI usage
- Clean analytics
- Long-term relationships

---

## 7️⃣ Dependency

Depends on:
- Response Classification
- AI Reply Rules
- Review Invitation Flow

Next prompt will define:
- Landing pages & question flow logic

---

# PROMPT 8 — Landing Pages & Progressive Question Flow Logic

## Objective
Design a **progressive, state-aware landing page system** that:
- Collects information without friction
- Adapts questions based on prior responses
- Feels conversational, not form-heavy
- Feeds directly into the engagement state machine

This replaces static forms with **guided decision paths**.

---

## 1️⃣ Core Principle

No long forms.  
No overwhelming screens.  
No generic questionnaires.

Each interaction should feel like:
> “One simple question at a time.”

---

## 2️⃣ Landing Page Architecture

### Single Dynamic Route
Use ONE canonical route: /engage/[token]

Where:
- `token` = unique per institution
- Token resolves:
  - Institution ID
  - Current engagement state
  - Prior answers (if any)

---

## 3️⃣ Page Structure (UI Rules)

Each step must contain:
- Clear headline (1 sentence)
- Short context (1–2 lines max)
- One question OR decision
- Primary action button
- Secondary option (if applicable)

No scrolling required per step.

---

## 4️⃣ Question Types (Allowed)

### A. Single-Select (Radio)
Used for:
- Current compliance method
- Platform usage
- Readiness level

Example:
> How do you currently submit data to QCTO?

- Manual (Email / Paper)
- CSV uploads
- Another platform
- Not submitting consistently

---

### B. Multi-Select (Checkbox)
Used sparingly for:
- Challenges
- Pain points

Example:
> What’s hardest about compliance right now?

- Keeping records up to date  
- Preparing for audits  
- Tracking attendance  
- Submitting evidence  

---

### C. Conditional Free Text
ONLY shown when:
- “Other” is selected
- Objection is expressed

Never show text boxes by default.

---

## 5️⃣ Progressive Logic Rules

Each answer determines:
- Next question
- Copy tone
- Engagement state transition

Example:
- Manual → show visibility benefits
- CSV → show automation benefits
- Another platform → ask soft comparison question
- Not submitting → show risk awareness content

---

## 6️⃣ State Transitions (Integration)

| Action | Resulting State |
|------|----------------|
Answer first question | ENGAGED |
Complete 2–3 steps | EVALUATING |
Click “Review Invitation” | EVALUATING |
Click “Access Dashboard” | READY |
Explicit decline | DECLINED |

---

## 7️⃣ Data Storage Requirements

For each interaction store:
- Question ID
- Answer(s)
- Timestamp
- Engagement state at time of answer

Answers must be:
- Immutable (append-only)
- Auditable
- Replayable for analytics

---

## 8️⃣ UX Safeguards

- Progress indicator (pills, not percentages)
- Back button (previous step only)
- Exit option (does not equal decline)

If user exits:
- Save progress
- Move to PAUSED after inactivity

---

## 9️⃣ What This Enables

- AI-aware personalization
- Objection handling
- Intent scoring
- Clean segmentation
- Future re-engagement

---

## 🔟 Explicit Non-Goals

Do NOT:
- Collect sensitive data
- Ask for payment
- Ask for login
- Show dashboards

This is **trust-building only**.

---

## Dependency
Requires:
- Engagement State Machine (PROMPT 7)

Next prompt will define:
- AI response generation rules per state

---

# PROMPT 9 — AI Response Generation & Tone Control Rules

## Objective
Define **strict AI boundaries** for how the system:
- Generates personalised email responses
- Adapts tone based on engagement state
- Feels human, calm, and trustworthy
- Never sounds like marketing automation

This governs **all AI-written communication** after the first touch.

---

## 1️⃣ Core Philosophy

The AI is **not a salesperson**.  
The AI is **not persuasive by force**.  
The AI behaves like a:
> “Thoughtful, informed human following up politely.”

No hype.  
No pressure.  
No manipulation.

---

## 2️⃣ AI Activation Rules

AI-generated content ONLY starts when:
- A recipient clicks a link
- A recipient answers a question
- A recipient writes a response
- A recipient declines with a reason

The **first email is static** and human-written.

---

## 3️⃣ Engagement-State–Driven Tone

| Engagement State | Tone |
|----------------|------|
UNAWARE | Informative, neutral |
ENGAGED | Curious, supportive |
EVALUATING | Clarifying, reassuring |
READY | Confident, welcoming |
DECLINED | Respectful, appreciative |
PAUSED | Light, non-intrusive |

Tone must NEVER escalate beyond its state.

---

## 4️⃣ Language Rules (Hard Constraints)

The AI MUST:
- Use simple sentences
- Use natural pauses
- Reference the user’s answers explicitly
- Sound like one person, not a team

The AI MUST NOT:
- Use buzzwords
- Use urgency tactics
- Use emojis
- Mention AI, automation, or models
- Say “based on your data” (say “based on what you shared”)

---

## 5️⃣ Personalisation Rules

Every AI message must include:
- One reference to a prior answer
- One reflective sentence (acknowledging their situation)
- One soft next step (optional, never forced)

Example structure:
1. Acknowledge
2. Reflect
3. Offer

---

## 6️⃣ Objection Handling Logic

If objection is detected:
- Do NOT counter immediately
- Do NOT argue
- Do NOT reframe aggressively

Instead:
- Validate
- Clarify
- Offer optional info

Example:
> “That makes sense. A lot of institutions feel the same way, especially when they already have something that works for them.”

---

## 7️⃣ Decline Response Rules

When someone declines:
- Thank them
- Ask nothing further (optional one-click feedback only)
- Mark state as DECLINED
- Suppress future outreach unless reactivated

No follow-ups unless explicitly allowed.

---

## 8️⃣ Output Constraints

Each AI response:
- Max 120 words
- Max 3 short paragraphs
- No bullet points unless asked
- No links unless explicitly relevant

---

## 9️⃣ Prompting Strategy (Internal)

AI system prompt must include:
- Platform purpose summary
- Role (calm institutional liaison)
- Allowed tone per state
- Prohibited phrases list
- Personalisation rules

This prompt must be locked and versioned.

---

## 🔟 What This Enables

- Trust at scale
- Human-feeling follow-ups
- Zero spam perception
- High-quality conversion without pressure

---

## Dependency
Requires:
- Engagement states (PROMPT 7)
- Question flow logic (PROMPT 8)

Next prompt will define:
- Engagement scoring & progression thresholds

---

# PROMPT 10 — Engagement Scoring & State Transition Engine

## Objective
Define a **transparent, deterministic engagement scoring system** that:
- Tracks how institutions interact over time
- Determines when they move between engagement states
- Guides what content, tone, and actions are allowed next
- Prevents over-contacting or premature escalation

This is the **brain** behind the outreach flow.

---

## 1️⃣ Core Principle

People do not “convert” instantly.  
They **progress**.

The system must:
- Observe behaviour
- Assign meaning
- Change state only when justified

No guessing. No forcing.

---

## 2️⃣ Engagement States (Canonical)

Each institution exists in **one state at a time**:

1. UNAWARE  
2. AWARE  
3. ENGAGED  
4. EVALUATING  
5. READY  
6. DECLINED  
7. PAUSED  

States are mutually exclusive.

---

## 3️⃣ Scoring Events

Each interaction produces **points**.

### Positive Signals

| Action | Score |
|------|------|
Email opened | +1 |
Link clicked | +3 |
Page completed | +5 |
Question answered | +5 |
Review invitation viewed | +7 |
Invite accepted | +15 |

### Neutral Signals

| Action | Score |
|------|------|
Email ignored | 0 |
Page viewed briefly | 0 |

### Negative Signals

| Action | Score |
|------|------|
Explicit decline | -20 |
“Not interested” selected | -15 |
Unsubscribe | -100 (terminal) |

---

## 4️⃣ State Transition Thresholds

| From → To | Score Requirement |
|---------|------------------|
UNAWARE → AWARE | ≥ 3 |
AWARE → ENGAGED | ≥ 8 |
ENGAGED → EVALUATING | ≥ 15 |
EVALUATING → READY | ≥ 25 |
ANY → DECLINED | Explicit decline |
ANY → PAUSED | 14 days inactivity |

Transitions are **one-way**, except:
- PAUSED → previous state (on activity)
- DECLINED → CLOSED (after cooling period)

---

## 5️⃣ Time-Based Decay

To prevent artificial inflation:

- Scores decay by **10% every 14 days** of inactivity
- Decay stops once READY is reached
- DECLINED scores do not decay

---

## 6️⃣ Behaviour Overrides

Certain actions override score logic:

- Invite acceptance → READY immediately
- Decline → DECLINED immediately
- Manual admin override allowed (logged)

---

## 7️⃣ State-Based Permissions

Each state unlocks different system actions:

| State | Allowed Actions |
|------|----------------|
UNAWARE | Intro email only |
AWARE | Educational content |
ENGAGED | Questions, light follow-ups |
EVALUATING | Review invitation |
READY | Onboarding & invite |
PAUSED | Gentle check-in only |
DECLINED | No outreach |

---

## 8️⃣ Data Model Requirements

Each institution must store:
- Current state
- Current score
- Last activity timestamp
- Transition history (audit)

All transitions must be logged.

---

## 9️⃣ Analytics & Admin Visibility

Platform Admin dashboard must show:
- Institutions per state
- Average time per state
- Drop-off points
- Conversion ratios
- Decline reasons by state

---

## 🔟 Why This Matters

This ensures:
- No spam behaviour
- Predictable outcomes
- Human-feeling pacing
- Trust-first growth

---

## Dependency
Requires:
- AI tone rules (PROMPT 9)
- Awareness flow (PROMPT 4–8)

Next prompt will define:
- Admin dashboards & monitoring for this system

---

# PROMPT 11: Admin Dashboard, Metrics & Intelligence Layer

## Objective
Design and implement a **Platform Admin–only dashboard** that provides real-time, actionable visibility into the entire institutional outreach and engagement system.

This dashboard is NOT just analytics.
It is a **decision-making cockpit**.

---

## Core Principles
- Metrics must reflect **human engagement**, not vanity stats
- Data must map directly to **engagement states**
- Admin must see **where institutions are stuck**
- Admin must see **why institutions are stuck**
- Admin must know **what to do next**

---

## Required Dashboard Sections

### 1️⃣ Global Funnel Overview
A single high-level view showing:

- Total institutions in system
- Institutions per awareness stage:
  - Unaware
  - Problem-aware
  - Solution-aware
  - Trust-aware
  - Action-ready
  - Onboarded
- Conversion percentages between stages
- Drop-off points

> This should visually resemble a funnel, not a table.

---

### 2️⃣ Engagement Activity Metrics
Track and display:

- Emails sent (by campaign + stage)
- Open rates (per stage)
- Click-through rates
- Landing page completion rates
- Review invitation completions
- Direct dashboard access clicks

Allow filtering by:
- Date range
- Institution type
- Province
- Engagement stage

---

### 3️⃣ Institution-Level Journey View
For any single institution, show:

- Timeline of interactions
  - Emails received
  - Links clicked
  - Pages visited
  - Questions answered
  - Declines / objections
- Current engagement state
- Engagement score
- Last activity timestamp
- AI-generated summary:
  > “This institution appears hesitant due to X. Recommended next action: Y.”

---

### 4️⃣ Objection & Decline Intelligence
Aggregate insights from decline reasons and objections:

- Most common decline reasons
- Trends over time
- Institutions using competitors
- Institutions citing manual processes
- Institutions unsure / delaying

Visualise this data clearly to inform strategy updates.

---

### 5️⃣ Performance Signals (Leading Indicators)
Track signals that indicate future conversion:

- Partial form completions
- Multiple link clicks
- Repeated page visits
- Long dwell time on value pages

Flag these institutions as:
> “Warm – requires human follow-up”

---

## Data Requirements
Ensure all dashboard data is sourced from:
- Engagement events
- State transitions
- Stored answers
- AI classification outputs

NO scraping.
NO inferred guesses without data.

---

## Constraints
- Dashboard must not expose personal learner data
- Admin-only access enforced via RBAC
- Scalable to thousands of institutions
- Optimised queries (no N+1 issues)

---

## Outcome
The Admin should be able to answer, instantly:
- What’s working?
- What’s not?
- Who needs attention?
- What do we change next?

---

# PROMPT 12: Safety, Deliverability, Rate Limits & Trust Guards

## Objective
Implement **hard safety boundaries** to ensure the engagement system:
- Never feels like spam
- Never damages domain reputation
- Never overwhelms recipients
- Never allows uncontrolled AI behavior

Trust > Speed.

---

## Email Sending Safeguards

### 1️⃣ Rate Limiting
Implement:
- Max emails per hour
- Max emails per day
- Staggered sending (batching)
- Randomised send intervals

These limits must be configurable by Platform Admin.

---

### 2️⃣ Engagement-Based Throttling
Rules:
- If no interaction after X emails → slow down
- If active interaction → allow progression
- If explicit decline → pause outreach automatically
- If “not now” → snooze for configurable period

---

### 3️⃣ Suppression Rules
Automatically suppress emails when:
- Institution is fully onboarded
- Institution manually unsubscribes
- Institution explicitly declines
- Institution is inactive beyond defined threshold

Maintain a **suppression log** for auditing.

---

## AI Safety Boundaries

### 4️⃣ AI Content Constraints
AI must NEVER:
- Invent regulatory claims
- Imply QCTO endorsement unless factual
- Pressure or threaten institutions
- Promise outcomes or approvals
- Change tone beyond defined rules

All AI output must pass:
- Tone guard
- Claim guard
- Length guard
- Intent guard

---

### 5️⃣ Human Override
Admin must be able to:
- Pause campaigns instantly
- Disable AI replies
- Switch to manual messaging
- Edit templates mid-campaign

---

## Deliverability Protection

### 6️⃣ Domain & Reputation Hygiene
Ensure:
- Correct SPF, DKIM, DMARC
- No reply-to misconfiguration
- Clean sender separation (no-reply vs human)
- No tracking abuse

Click tracking must be subtle and non-invasive.

---

## Legal & Ethical Guards

### 7️⃣ Consent & Transparency
- Clear opt-out option
- Respect POPIA principles
- Minimal data collection
- Purpose-limited processing

Log consent-related actions.

---

## Outcome
The system must behave like:
> A thoughtful human building a relationship  
Not a machine chasing conversions

---

# PROMPT 13: Testing, Rollout & Iterative Learning Framework

## Objective
Design a **safe, controlled rollout process** for the new institutional outreach and engagement system.

This system must be introduced **incrementally**, validated at each stage, and continuously improved using real data — not assumptions.

---

## Guiding Principles
- Small batches before scale
- Observe before optimizing
- Humans first, automation second
- Learning > speed

---

## Phase 1: Internal Validation (Pre-Launch)

### 1️⃣ Internal Dry Runs
Simulate the full journey using:
- Test institutions
- Internal email addresses
- Sandbox AI responses

Validate:
- State transitions
- Data storage
- AI tone compliance
- Dashboard accuracy

NO real institutions involved at this stage.

---

## Phase 2: Limited External Pilot

### 2️⃣ Pilot Group Selection
Select a **small, controlled subset** of institutions:
- 20–50 max
- Mixed engagement likelihood
- Different provinces / institution types

Mark these institutions as:
> pilot = true

---

### 3️⃣ Pilot Rules
- Only first awareness email enabled
- AI responses enabled **after first interaction only**
- Manual monitoring required
- Daily review by Platform Admin

---

### 4️⃣ Pilot Metrics to Monitor
Track:
- Open rates
- Click-through rates
- Page completion rates
- Decline reasons
- Time-to-response
- Engagement score movement

Log all anomalies.

---

## Phase 3: Controlled Expansion

### 5️⃣ Gradual Scaling
Increase rollout in waves:
- 50 → 100 → 250 → 500 institutions
- Pause between waves
- Review dashboard insights before each increase

---

### 6️⃣ Iteration Rules
Adjust ONLY:
- Copy
- Timing
- Questions
- Stage transitions

DO NOT:
- Change core architecture
- Change scoring logic mid-wave
- Reset states arbitrarily

---

## Phase 4: Continuous Learning Loop

### 7️⃣ Feedback Integration
Use:
- Decline reasons
- Objections
- Partial completions
- Engagement drops

To:
- Refine awareness stages
- Improve landing pages
- Adjust AI prompts
- Improve perceived trust

---

## Outcome
By the end of this phase:
- We know what works
- We know what doesn’t
- The system earns trust naturally
- Scaling becomes safe and predictable

---

# PROMPT 14: Final Integration Rules & “Do Not Break” Constraints

## Objective
Define **non-negotiable system rules** that protect stability, trust, and long-term scalability.

These rules exist to prevent:
- Feature creep
- Silent regressions
- Trust erosion
- Data inconsistency

---

## Core “Do Not Break” Rules

### 1️⃣ Engagement State Integrity
- Engagement state must be:
  - Explicit
  - Traceable
  - Non-ambiguous
- No skipping states without logged reason
- No retroactive state changes without admin action

---

### 2️⃣ Single Source of Truth
- Engagement data lives in ONE canonical system
- No duplication of:
  - State
  - Scores
  - Responses
- Dashboards must reflect raw data, not recalculated guesses

---

### 3️⃣ AI Is an Assistant, Not an Authority
AI must NEVER:
- Approve onboarding
- Override explicit user decisions
- Change engagement state alone
- Send messages without a defined trigger

AI actions must always be:
> Triggered → Logged → Reviewable

---

### 4️⃣ Manual Override Always Exists
Platform Admin must be able to:
- Pause any institution
- Reset an engagement journey
- Disable AI globally or per institution
- Send a human-authored message at any point

---

### 5️⃣ Separation of Concerns
Ensure strict separation between:
- Outreach logic
- Core compliance logic
- Learner data
- Regulatory workflows

No engagement feature may:
- Mutate compliance data
- Affect QCTO decision processes
- Expose learner information

---

### 6️⃣ Backward Compatibility
- Existing invite flows must continue to work
- Existing institutions must not be forced into new journeys
- Migration paths must be explicit and opt-in

---

### 7️⃣ Auditability
Every critical action must be logged:
- Emails sent
- AI messages generated
- State transitions
- Admin overrides
- Suppressions

Logs must be:
- Timestamped
- User-attributed
- Immutable

---

## Final Principle

If this system ever feels:
- Pushy
- Manipulative
- Confusing
- Spammy

Then it is broken — even if it “converts”.

Trust is the product.

---

## Outcome
This framework ensures:
- Long-term adoption
- Institutional respect
- Regulator confidence
- A system that compounds in value over years

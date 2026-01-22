# Workflow Efficiency Dashboard Fix - Implementation Plan

## Objective
Replace all placeholder data in the Platform Admin Dashboard's "Workflow Efficiency" section with real data from the database. If a value is actually zero, display "0" instead of placeholder text.

## Current Issues
The Workflow Efficiency section (lines 288-330 in `PlatformAdminDashboardClient.tsx`) contains:
1. **Avg Review Time** - Hardcoded to 0, subtitle shows "2.3 days (trend placeholder)"
2. **Submissions Today** - Already has real data (good)
3. **Overdue Submissions** - Hardcoded to 0, subtitle shows "> X days (placeholder)"
4. **Returned vs Approved** - Hardcoded to 0, subtitle shows "Ratio (placeholder)"

## Data Requirements

### 1. Average Review Time
- **Calculation**: Average time between `submitted_at` and `reviewed_at` for all submissions that have been reviewed
- **Query**: 
  - Find all submissions where `reviewed_at IS NOT NULL` and `submitted_at IS NOT NULL`
  - Calculate `reviewed_at - submitted_at` for each
  - Average the results
  - Format as days (e.g., "2.3 days")
- **Trend**: Compare current period vs previous period (e.g., last 30 days vs previous 30 days)
- **Display**: Show average in days, with trend indicator (up/down) and change amount

### 2. Overdue Submissions
- **Definition**: Submissions that have been in SUBMITTED or UNDER_REVIEW status for more than X days (e.g., 7 days)
- **Query**:
  - Find submissions where:
    - `status IN ('SUBMITTED', 'UNDER_REVIEW')`
    - `submitted_at IS NOT NULL`
    - `submitted_at < (NOW() - INTERVAL '7 days')`
  - Count the results
- **Display**: Show count, subtitle should show "> 7 days overdue" (or similar)

### 3. Returned vs Approved Ratio
- **Calculation**: Ratio of RETURNED_FOR_CORRECTION submissions to APPROVED submissions
- **Query**:
  - Count submissions with `status = 'RETURNED_FOR_CORRECTION'`
  - Count submissions with `status = 'APPROVED'`
  - Calculate ratio: `returned_count / approved_count` (or show as "X:Y" format)
- **Display**: 
  - If both are 0, show "0:0" or "No data"
  - If approved is 0 but returned > 0, show "∞" or "All returned"
  - Otherwise show ratio (e.g., "0.5" or "1:2")

## Implementation Steps

### Step 1: Update Server Component (`page.tsx`)
Add new database queries to fetch:
- Average review time (with trend calculation)
- Overdue submissions count
- Returned and approved submission counts

### Step 2: Update Client Component (`PlatformAdminDashboardClient.tsx`)
- Replace hardcoded values with props
- Update subtitles to show real data instead of "placeholder"
- Format numbers appropriately (decimals, ratios, etc.)

### Step 3: Add Helper Functions
- Function to calculate average review time
- Function to format days (e.g., "2.3 days")
- Function to calculate trend (current vs previous period)

## Database Schema Reference
- `Submission` model has:
  - `submitted_at: DateTime?`
  - `reviewed_at: DateTime?`
  - `status: SubmissionStatus` (enum: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, RETURNED_FOR_CORRECTION)

## Testing Checklist
- [ ] Average review time shows real calculated value
- [ ] Average review time shows "0" if no reviewed submissions exist
- [ ] Trend indicator works correctly (up/down)
- [ ] Overdue submissions count is accurate
- [ ] Overdue submissions shows "0" if none are overdue
- [ ] Returned vs Approved ratio is calculated correctly
- [ ] Ratio handles edge cases (0 approved, 0 returned, etc.)
- [ ] All placeholders removed from subtitles
- [ ] Dashboard loads without errors
- [ ] Performance is acceptable (queries are efficient)

## Edge Cases to Handle
1. No reviewed submissions → Avg Review Time = 0 or "N/A"
2. No overdue submissions → Show 0
3. No approved submissions but some returned → Show appropriate ratio
4. No returned submissions but some approved → Show 0 or "0:1"
5. Both counts are 0 → Show "0:0" or "No data"

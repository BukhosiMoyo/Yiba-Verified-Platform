# API Documentation

## Overview

The Yiba Verified API provides comprehensive endpoints for managing educational institutions, learners, enrolments, submissions, and QCTO workflows.

## Quick Start

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.yiba.co.za/api`

### Authentication

#### Development Mode

Use the `X-DEV-TOKEN` header with your development token:

```bash
curl -H "X-DEV-TOKEN: your-dev-token" http://localhost:3000/api/learners
```

#### Production Mode

Authenticate via NextAuth and use session cookies:

```bash
# Login first
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use session cookie in subsequent requests
curl -H "Cookie: next-auth.session-token=..." http://localhost:3000/api/learners
```

## Interactive Documentation

### Option 1: Swagger UI (Recommended)

1. Install Swagger UI locally or use online version:
   ```bash
   npm install -g swagger-ui-serve
   swagger-ui-serve docs/09-API/OPENAPI.yaml
   ```

2. Or use online Swagger Editor:
   - Visit https://editor.swagger.io/
   - Import `OPENAPI.yaml` file

### Option 2: ReDoc

Use ReDoc for beautiful, responsive documentation:

```bash
npm install -g redoc-cli
redoc-cli serve docs/09-API/OPENAPI.yaml
```

### Option 3: VS Code Extension

Install the "OpenAPI (Swagger) Editor" extension in VS Code to view the spec with syntax highlighting and validation.

## API Endpoints Overview

### Learners
- `GET /api/learners` - List learners
- `POST /api/learners` - Create learner
- `GET /api/learners/{learnerId}` - Get learner
- `PATCH /api/learners/{learnerId}` - Update learner

### Enrolments
- `GET /api/enrolments` - List enrolments
- `POST /api/enrolments` - Create enrolment
- `GET /api/enrolments/{enrolmentId}` - Get enrolment

### Submissions
- `GET /api/institutions/submissions` - List submissions
- `POST /api/institutions/submissions` - Create submission
- `GET /api/institutions/submissions/{submissionId}` - Get submission
- `PATCH /api/institutions/submissions/{submissionId}` - Update submission

### Documents
- `GET /api/institutions/documents` - List documents
- `POST /api/institutions/documents` - Upload document
- `GET /api/institutions/documents/{documentId}` - Get document
- `PATCH /api/institutions/documents/{documentId}` - Replace document
- `GET /api/institutions/documents/{documentId}/download` - Download document

### QCTO Endpoints
- `GET /api/qcto/submissions` - List submissions for review
- `PATCH /api/qcto/submissions/{submissionId}` - Review submission
- `GET /api/qcto/readiness` - List readiness records
- `PATCH /api/qcto/readiness/{readinessId}/review` - Review readiness

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications/{notificationId}` - Mark as read

### Export
- `GET /api/export/learners?format=csv` - Export learners
- `GET /api/export/enrolments?format=json` - Export enrolments
- `GET /api/export/submissions?format=csv` - Export submissions
- `GET /api/export/readiness?format=json` - Export readiness records
- `GET /api/export/audit-logs?format=csv` - Export audit logs

## Role-Based Access Control (RBAC)

### PLATFORM_ADMIN
- Full access to all resources across all institutions
- Can create learners for any institution
- Can view all audit logs and statistics

### QCTO_USER
- Read-only access to approved submissions and requests
- Can review and approve/reject submissions and readiness records
- Can flag documents for review

### INSTITUTION_ADMIN
- Full access to their institution's resources
- Can manage learners, enrolments, submissions, documents
- Can approve/reject QCTO requests

### INSTITUTION_STAFF
- Limited access to their institution's resources
- Can view and edit resources but may have restrictions on certain operations

### STUDENT
- Access only to their own learner data and enrolments

## Error Codes

- `UNAUTHENTICATED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `INTERNAL_ERROR` (500): Server error
- `RATE_LIMIT_EXCEEDED` (429): Too many requests

## Rate Limiting

- **Auth endpoints**: 5 requests per 15 minutes
- **Mutations** (POST/PATCH/DELETE): 30 requests per minute
- **File uploads**: 10 requests per minute
- **Standard API** (GET): 60 requests per minute
- **Read operations**: 120 requests per minute

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Time when limit resets
- `Retry-After`: Seconds to wait before retrying

## Examples

### Create a Learner

```bash
curl -X POST http://localhost:3000/api/learners \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: your-dev-token" \
  -d '{
    "national_id": "9001015009088",
    "first_name": "Jane",
    "last_name": "Doe",
    "birth_date": "1990-01-01",
    "gender_code": "F",
    "nationality_code": "ZA",
    "popia_consent": true,
    "consent_date": "2024-01-01"
  }'
```

### Upload a Document

```bash
curl -X POST http://localhost:3000/api/institutions/documents \
  -H "X-DEV-TOKEN: your-dev-token" \
  -F "file=@document.pdf" \
  -F "related_entity=INSTITUTION" \
  -F "document_type=certificate"
```

### Export Learners as CSV

```bash
curl -X GET "http://localhost:3000/api/export/learners?format=csv&institution_id=inst-123" \
  -H "X-DEV-TOKEN: your-dev-token" \
  -o learners.csv
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available in `OPENAPI.yaml`.

To view it interactively:
1. Use Swagger UI (https://editor.swagger.io/)
2. Use ReDoc (https://redocly.github.io/redoc/)
3. Use VS Code with OpenAPI extension

## Support

For API support, contact: support@yiba.co.za

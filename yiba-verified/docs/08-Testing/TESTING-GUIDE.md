# Testing Guide

## Overview

This project uses **Vitest** for testing - a modern, fast test runner that works seamlessly with Next.js and TypeScript.

## Setup

### Install Dependencies

```bash
npm install -D vitest @vitejs/plugin-react @vitest/ui
```

### Run Tests

```bash
# Run tests in watch mode (development)
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/
├── lib/
│   ├── security/
│   │   └── __tests__/
│   │       └── validation.test.ts
│   └── notifications/
│       └── __tests__/
│           └── notifications.test.ts
└── test/
    ├── setup.ts          # Global test setup
    ├── utils.ts          # Test helper functions
    └── fixtures.ts       # Reusable test data
```

## Writing Tests

### Unit Tests

Test individual functions and utilities:

```typescript
import { describe, it, expect } from "vitest";
import { sanitizeString } from "@/lib/security/validation";

describe("sanitizeString", () => {
  it("should trim whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });
});
```

### Integration Tests

Test API routes and database interactions:

```typescript
import { describe, it, expect } from "vitest";
import { createMockRequest, createMockContext } from "@/test/utils";

describe("POST /api/learners", () => {
  it("should create a learner", async () => {
    const request = createMockRequest("/api/learners", {
      method: "POST",
      body: { /* test data */ },
    });
    
    // Test implementation
  });
});
```

## Test Utilities

### `createMockContext()`

Create mock API context for testing:

```typescript
const ctx = createMockContext({
  role: "PLATFORM_ADMIN",
  institutionId: null,
});
```

### `createMockRequest()`

Create mock NextRequest for API route testing:

```typescript
const request = createMockRequest("/api/endpoint", {
  method: "POST",
  headers: { "X-DEV-TOKEN": "test-token" },
  body: { key: "value" },
});
```

### Test Fixtures

Use predefined test data:

```typescript
import { mockUser, mockInstitution, mockLearner } from "@/test/fixtures";
```

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on other tests
2. **Use Mocks**: Mock external dependencies (database, APIs, etc.)
3. **Test Edge Cases**: Test both success and failure scenarios
4. **Descriptive Names**: Use clear, descriptive test names
5. **AAA Pattern**: Arrange, Act, Assert structure

## Coverage Goals

- **Unit Tests**: >80% coverage for utility functions
- **Integration Tests**: Critical API routes should have integration tests
- **E2E Tests**: Core user workflows should have end-to-end tests

## Mocking Prisma

```typescript
vi.mock("@/lib/prisma", () => ({
  prisma: {
    learner: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
```

## Mocking Next.js Modules

```typescript
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));
```

## CI/CD Integration

Tests should run automatically in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm run test:run
```

## Troubleshooting

### Tests failing due to module resolution

Ensure `vitest.config.ts` has proper path aliases configured.

### Prisma client errors in tests

Mock Prisma client or use a test database:

```typescript
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)

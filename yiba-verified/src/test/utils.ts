// Test utilities and helpers
import type { ApiContext } from "@/lib/api/context";
import type { Role } from "@/lib/rbac";

/**
 * Create a mock API context for testing
 */
export function createMockContext(overrides?: Partial<ApiContext>): ApiContext {
  return {
    userId: "test-user-id",
    role: "INSTITUTION_ADMIN",
    institutionId: "test-institution-id",
    ...overrides,
  };
}

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): any {
  return {
    url,
    method: options.method || "GET",
    headers: {
      get: (key: string) => options.headers?.[key] || null,
      has: (key: string) => !!options.headers?.[key],
      "content-type": options.headers?.["content-type"] || "application/json",
    },
    nextUrl: {
      pathname: new URL(url, "https://yibaverified.co.za").pathname,
      searchParams: new URL(url, "https://yibaverified.co.za").searchParams,
    },
    json: async () => options.body || {},
    formData: async () => new FormData(),
  };
}

/**
 * Wait for async operations to complete
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that a promise rejects with a specific error
 */
export async function expectRejection(
  promise: Promise<any>,
  expectedError: string | RegExp
): Promise<void> {
  try {
    await promise;
    throw new Error("Expected promise to reject, but it resolved");
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    if (typeof expectedError === "string") {
      if (!errorMessage.includes(expectedError)) {
        throw new Error(
          `Expected error to contain "${expectedError}", but got: ${errorMessage}`
        );
      }
    } else {
      if (!expectedError.test(errorMessage)) {
        throw new Error(
          `Expected error to match ${expectedError}, but got: ${errorMessage}`
        );
      }
    }
  }
}

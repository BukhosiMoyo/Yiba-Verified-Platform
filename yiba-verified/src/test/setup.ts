// Test setup file
// Runs before all tests to configure the test environment

import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/yiba_test";
process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only";
process.env.DEV_API_TOKEN = "test-dev-token";

// Global test setup
beforeAll(() => {
  // Setup code that runs once before all tests
  console.log("🧪 Test suite starting...");
});

afterAll(() => {
  // Cleanup code that runs once after all tests
  console.log("✅ Test suite completed");
});

beforeEach(() => {
  // Setup code that runs before each test
});

afterEach(() => {
  // Cleanup code that runs after each test
  // Clear mocks, reset state, etc.
});

import { vi } from "vitest";

// Mock Next.js modules that aren't available in Node.js test environment
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock Next.js server modules
vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    NextRequest: class {
      url: string;
      method: string;
      headers: Headers;
      nextUrl: URL;
      body: any;

      constructor(url: string, init?: any) {
        this.url = url;
        this.method = init?.method || "GET";
        this.headers = new Headers(init?.headers || {});
        this.nextUrl = new URL(url, "http://localhost:3000");
        this.body = init?.body;
      }

      async json() {
        return typeof this.body === "string" ? JSON.parse(this.body) : this.body;
      }

      async formData() {
        return new FormData();
      }
    },
    NextResponse: {
      json: (data: any, init?: any) => ({
        json: async () => data,
        status: init?.status || 200,
        headers: new Headers(init?.headers || {}),
      }),
      redirect: (url: string) => ({
        status: 302,
        headers: { Location: url },
      }),
      next: () => ({
        status: 200,
        headers: new Headers(),
      }),
    },
  };
});

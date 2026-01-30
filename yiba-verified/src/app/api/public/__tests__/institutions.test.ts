/**
 * Integration-style tests for public institutions API.
 * Mocks Prisma and invokes route handlers directly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getInstitutions } from "../../institutions/route";
import { POST as postLead } from "../../institutions/[slug]/lead/route";

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    institutionPublicProfile: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      count: mockCount,
    },
    institutionLead: {
      create: mockCreate,
    },
  },
}));

vi.mock("@/lib/notifications", () => ({
  Notifications: {
    newLead: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/api/rateLimit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 10,
    resetAt: Date.now() + 60000,
  }),
  RATE_LIMITS: {},
}));

describe("GET /api/public/institutions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
  });

  it("returns 200 with items array when no profiles", async () => {
    const req = new Request("http://localhost/api/public/institutions");
    const res = await getInstitutions(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items).toHaveLength(0);
    expect(data.total).toBe(0);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ is_public: true }),
      })
    );
  });

  it("queries only is_public profiles", async () => {
    const req = new Request("http://localhost/api/public/institutions");
    await getInstitutions(req);
    expect(mockFindMany).toHaveBeenCalled();
    const call = mockFindMany.mock.calls[0][0];
    expect(call.where).toBeDefined();
    expect(call.where.is_public).toBe(true);
    expect(call.where.institution).toEqual({ deleted_at: null });
  });
});

describe("POST /api/public/institutions/[slug]/lead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue({ institution_id: "inst-123" });
    mockCreate.mockResolvedValue({
      id: "lead-123",
      institution_id: "inst-123",
      source: "PUBLIC",
      full_name: "Test User",
      email: "test@example.com",
      status: "NEW",
    });
  });

  it("returns 201 and creates lead with valid body", async () => {
    const req = new Request("http://localhost/api/public/institutions/test-slug/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Test User",
        email: "test@example.com",
      }),
    });
    const res = await postLead(req, { params: Promise.resolve({ slug: "test-slug" }) });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.id).toBe("lead-123");
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        institution_id: "inst-123",
        source: "PUBLIC",
        full_name: "Test User",
        email: "test@example.com",
        status: "NEW",
      }),
    });
  });

  it("returns 400 when email is missing", async () => {
    const req = new Request("http://localhost/api/public/institutions/test-slug/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Test User",
      }),
    });
    const res = await postLead(req, { params: Promise.resolve({ slug: "test-slug" }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when full_name is too short", async () => {
    const req = new Request("http://localhost/api/public/institutions/test-slug/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "A",
        email: "test@example.com",
      }),
    });
    const res = await postLead(req, { params: Promise.resolve({ slug: "test-slug" }) });
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 404 when profile not found or not public", async () => {
    mockFindFirst.mockResolvedValue(null);
    const req = new Request("http://localhost/api/public/institutions/unknown-slug/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Test User",
        email: "test@example.com",
      }),
    });
    const res = await postLead(req, { params: Promise.resolve({ slug: "unknown-slug" }) });
    expect(res.status).toBe(404);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

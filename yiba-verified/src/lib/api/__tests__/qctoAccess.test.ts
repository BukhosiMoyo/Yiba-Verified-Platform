/**
 * Test suite for QCTO access control helpers
 * 
 * Run with: tsx src/lib/api/__tests__/qctoAccess.test.ts
 * 
 * These tests verify the submission/request-based QCTO access model:
 * - PLATFORM_ADMIN always has access (app owners see everything! 🦸)
 * - QCTO_USER only sees resources in APPROVED submissions or requests
 * - Other roles are denied by default
 */

import { canReadForQCTO, assertCanReadForQCTO, canReadInstitutionForQCTO } from "../qctoAccess";
import type { ApiContext } from "../context";
import { AppError, ERROR_CODES } from "../errors";

// Mock Prisma client
const mockPrismaFindFirst = jest.fn();

// Mock the prisma module
jest.mock("@/lib/prisma", () => ({
  prisma: {
    submissionResource: {
      findFirst: jest.fn(),
    },
    qCTORequestResource: {
      findFirst: jest.fn(),
    },
    submission: {
      findFirst: jest.fn(),
    },
    qCTORequest: {
      findFirst: jest.fn(),
    },
  },
}));

// Import prisma after mocking
import { prisma } from "@/lib/prisma";

// Test contexts
const createPlatformAdminCtx = (): ApiContext => ({
  userId: "platform-admin-123",
  role: "PLATFORM_ADMIN",
  institutionId: null,
});

const createQCTOUserCtx = (): ApiContext => ({
  userId: "qcto-user-456",
  role: "QCTO_USER",
  institutionId: null,
});

const createInstitutionAdminCtx = (): ApiContext => ({
  userId: "inst-admin-789",
  role: "INSTITUTION_ADMIN",
  institutionId: "inst-001",
});

const createStudentCtx = (): ApiContext => ({
  userId: "student-999",
  role: "STUDENT",
  institutionId: null,
});

describe("canReadForQCTO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PLATFORM_ADMIN access", () => {
    it("should always return true for PLATFORM_ADMIN (app owners see everything! 🦸)", async () => {
      const ctx = createPlatformAdminCtx();

      // Should return true without any Prisma queries
      const result = await canReadForQCTO(ctx, "READINESS", "readiness-123");

      expect(result).toBe(true);
      expect(prisma.submissionResource.findFirst).not.toHaveBeenCalled();
      expect(prisma.qCTORequestResource.findFirst).not.toHaveBeenCalled();
    });

    it("should work for all resource types for PLATFORM_ADMIN", async () => {
      const ctx = createPlatformAdminCtx();
      const resourceTypes: Array<"READINESS" | "LEARNER" | "ENROLMENT" | "DOCUMENT" | "INSTITUTION"> = [
        "READINESS",
        "LEARNER",
        "ENROLMENT",
        "DOCUMENT",
        "INSTITUTION",
      ];

      for (const resourceType of resourceTypes) {
        const result = await canReadForQCTO(ctx, resourceType, "resource-123");
        expect(result).toBe(true);
      }
    });
  });

  describe("QCTO_USER access - APPROVED submissions", () => {
    it("should return true if resource is in an APPROVED submission", async () => {
      const ctx = createQCTOUserCtx();

      (prisma.submissionResource.findFirst as jest.Mock).mockResolvedValueOnce({
        resource_id: "sub-resource-123",
      });

      const result = await canReadForQCTO(ctx, "READINESS", "readiness-123");

      expect(result).toBe(true);
      expect(prisma.submissionResource.findFirst).toHaveBeenCalledWith({
        where: {
          resource_type: "READINESS",
          resource_id_value: "readiness-123",
          submission: {
            status: "APPROVED",
            deleted_at: null,
          },
        },
        select: {
          resource_id: true,
        },
      });
      // Should not check requests if submission is found
      expect(prisma.qCTORequestResource.findFirst).not.toHaveBeenCalled();
    });

    it("should return false if submission exists but is not APPROVED", async () => {
      const ctx = createQCTOUserCtx();

      // No APPROVED submission found
      (prisma.submissionResource.findFirst as jest.Mock).mockResolvedValueOnce(null);
      // No APPROVED request found
      (prisma.qCTORequestResource.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const result = await canReadForQCTO(ctx, "LEARNER", "learner-456");

      expect(result).toBe(false);
      expect(prisma.submissionResource.findFirst).toHaveBeenCalled();
      expect(prisma.qCTORequestResource.findFirst).toHaveBeenCalled();
    });
  });

  describe("QCTO_USER access - APPROVED QCTORequests", () => {
    it("should return true if resource is in an APPROVED QCTORequest", async () => {
      const ctx = createQCTOUserCtx();

      // No APPROVED submission
      (prisma.submissionResource.findFirst as jest.Mock).mockResolvedValueOnce(null);
      // But has APPROVED request
      (prisma.qCTORequestResource.findFirst as jest.Mock).mockResolvedValueOnce({
        resource_id: "request-resource-789",
      });

      const result = await canReadForQCTO(ctx, "ENROLMENT", "enrolment-789");

      expect(result).toBe(true);
      expect(prisma.submissionResource.findFirst).toHaveBeenCalled();
      expect(prisma.qCTORequestResource.findFirst).toHaveBeenCalledWith({
        where: {
          resource_type: "ENROLMENT",
          resource_id_value: "enrolment-789",
          request: {
            status: "APPROVED",
            deleted_at: null,
          },
        },
        select: {
          resource_id: true,
        },
      });
    });
  });

  describe("QCTO_USER access - deny by default", () => {
    it("should return false if resource is not in any APPROVED submission or request", async () => {
      const ctx = createQCTOUserCtx();

      // No APPROVED submission
      (prisma.submissionResource.findFirst as jest.Mock).mockResolvedValueOnce(null);
      // No APPROVED request
      (prisma.qCTORequestResource.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const result = await canReadForQCTO(ctx, "DOCUMENT", "doc-999");

      expect(result).toBe(false);
      expect(prisma.submissionResource.findFirst).toHaveBeenCalled();
      expect(prisma.qCTORequestResource.findFirst).toHaveBeenCalled();
    });
  });

  describe("Other roles", () => {
    it("should return false for INSTITUTION_ADMIN", async () => {
      const ctx = createInstitutionAdminCtx();

      const result = await canReadForQCTO(ctx, "READINESS", "readiness-123");

      expect(result).toBe(false);
      expect(prisma.submissionResource.findFirst).not.toHaveBeenCalled();
      expect(prisma.qCTORequestResource.findFirst).not.toHaveBeenCalled();
    });

    it("should return false for STUDENT", async () => {
      const ctx = createStudentCtx();

      const result = await canReadForQCTO(ctx, "LEARNER", "learner-456");

      expect(result).toBe(false);
      expect(prisma.submissionResource.findFirst).not.toHaveBeenCalled();
      expect(prisma.qCTORequestResource.findFirst).not.toHaveBeenCalled();
    });
  });
});

describe("assertCanReadForQCTO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not throw for PLATFORM_ADMIN", async () => {
    const ctx = createPlatformAdminCtx();

    await expect(
      assertCanReadForQCTO(ctx, "READINESS", "readiness-123")
    ).resolves.not.toThrow();
  });

  it("should not throw if QCTO_USER has access via submission", async () => {
    const ctx = createQCTOUserCtx();

    (prisma.submissionResource.findFirst as jest.Mock).mockResolvedValueOnce({
      resource_id: "sub-resource-123",
    });

    await expect(
      assertCanReadForQCTO(ctx, "READINESS", "readiness-123")
    ).resolves.not.toThrow();
  });

  it("should throw AppError if QCTO_USER does not have access", async () => {
    const ctx = createQCTOUserCtx();

    (prisma.submissionResource.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (prisma.qCTORequestResource.findFirst as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      assertCanReadForQCTO(ctx, "LEARNER", "learner-456")
    ).rejects.toThrow(AppError);

    try {
      await assertCanReadForQCTO(ctx, "LEARNER", "learner-456");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ERROR_CODES.FORBIDDEN);
      expect((error as AppError).status).toBe(403);
      expect((error as AppError).message).toContain("learner");
    }
  });

  it("should throw for non-QCTO/non-PLATFORM_ADMIN roles", async () => {
    const ctx = createInstitutionAdminCtx();

    await expect(
      assertCanReadForQCTO(ctx, "READINESS", "readiness-123")
    ).rejects.toThrow(AppError);

    try {
      await assertCanReadForQCTO(ctx, "READINESS", "readiness-123");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ERROR_CODES.FORBIDDEN);
    }
  });
});

describe("canReadInstitutionForQCTO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should always return true for PLATFORM_ADMIN", async () => {
    const ctx = createPlatformAdminCtx();

    const result = await canReadInstitutionForQCTO(ctx, "inst-001");

    expect(result).toBe(true);
    expect(prisma.submission.findFirst).not.toHaveBeenCalled();
    expect(prisma.qCTORequest.findFirst).not.toHaveBeenCalled();
  });

  it("should return true if institution has APPROVED submissions", async () => {
    const ctx = createQCTOUserCtx();

    (prisma.submission.findFirst as jest.Mock).mockResolvedValueOnce({
      submission_id: "sub-123",
    });

    const result = await canReadInstitutionForQCTO(ctx, "inst-001");

    expect(result).toBe(true);
    expect(prisma.submission.findFirst).toHaveBeenCalledWith({
      where: {
        institution_id: "inst-001",
        status: "APPROVED",
        deleted_at: null,
      },
      select: {
        submission_id: true,
      },
    });
    // Should not check requests if submission is found
    expect(prisma.qCTORequest.findFirst).not.toHaveBeenCalled();
  });

  it("should return true if institution has APPROVED QCTORequests", async () => {
    const ctx = createQCTOUserCtx();

    (prisma.submission.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (prisma.qCTORequest.findFirst as jest.Mock).mockResolvedValueOnce({
      request_id: "req-456",
    });

    const result = await canReadInstitutionForQCTO(ctx, "inst-002");

    expect(result).toBe(true);
    expect(prisma.submission.findFirst).toHaveBeenCalled();
    expect(prisma.qCTORequest.findFirst).toHaveBeenCalledWith({
      where: {
        institution_id: "inst-002",
        status: "APPROVED",
        deleted_at: null,
      },
      select: {
        request_id: true,
      },
    });
  });

  it("should return false if institution has no APPROVED submissions or requests", async () => {
    const ctx = createQCTOUserCtx();

    (prisma.submission.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (prisma.qCTORequest.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const result = await canReadInstitutionForQCTO(ctx, "inst-003");

    expect(result).toBe(false);
    expect(prisma.submission.findFirst).toHaveBeenCalled();
    expect(prisma.qCTORequest.findFirst).toHaveBeenCalled();
  });

  it("should return false for non-QCTO/non-PLATFORM_ADMIN roles", async () => {
    const ctx = createInstitutionAdminCtx();

    const result = await canReadInstitutionForQCTO(ctx, "inst-001");

    expect(result).toBe(false);
    expect(prisma.submission.findFirst).not.toHaveBeenCalled();
    expect(prisma.qCTORequest.findFirst).not.toHaveBeenCalled();
  });
});

/**
 * Tests for notification utilities
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Notifications } from "../../notifications";

// Mock Prisma
const mockCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      create: mockCreate,
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock email service
vi.mock("@/lib/email", () => ({
  sendEmailNotification: vi.fn().mockResolvedValue(undefined),
}));

describe("Notifications helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submissionReviewed", () => {
    it("should create approval notification", async () => {
      mockCreate.mockResolvedValue({
        notification_id: "notif-123",
        user_id: "user-123",
        notification_type: "SUBMISSION_APPROVED",
        title: "Submission Approved",
        message: "Your submission has been approved by QCTO.",
      });

      await Notifications.submissionReviewed("user-123", "sub-123", "APPROVED");

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          user_id: "user-123",
          notification_type: "SUBMISSION_APPROVED",
          title: "Submission Approved",
          message: "Your submission has been approved by QCTO.",
          entity_type: "SUBMISSION",
          entity_id: "sub-123",
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });
    });

    it("should create rejection notification", async () => {
      await Notifications.submissionReviewed("user-123", "sub-123", "REJECTED");

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notification_type: "SUBMISSION_REJECTED",
          title: "Submission Rejected",
        }),
        include: expect.any(Object),
      });
    });
  });

  describe("readinessReviewed", () => {
    it("should create recommendation notification", async () => {
      await Notifications.readinessReviewed("user-123", "ready-123", "RECOMMENDED");

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notification_type: "READINESS_RECOMMENDED",
          entity_type: "READINESS",
          entity_id: "ready-123",
        }),
        include: expect.any(Object),
      });
    });

    it("should create returned for correction notification", async () => {
      mockCreate.mockResolvedValue({});
      await Notifications.readinessReviewed("user-123", "ready-123", "RETURNED_FOR_CORRECTION");

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: "user-123",
          notification_type: "READINESS_REVIEWED",
          title: "Readiness Record Returned for Correction",
          message: expect.stringContaining("returned for correction"),
          entity_type: "READINESS",
          entity_id: "ready-123",
        }),
        include: expect.any(Object),
      });
    });
  });
});

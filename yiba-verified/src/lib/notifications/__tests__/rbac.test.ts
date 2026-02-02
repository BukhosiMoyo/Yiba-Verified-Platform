import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../service";
import { prisma } from "@/lib/prisma";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    prisma: {
        notification: {
            create: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
        emailQueue: {
            create: vi.fn(),
        }
    },
}));

// Mock Preferences
vi.mock("../preferences", () => ({
    shouldSendNotification: vi.fn().mockResolvedValue(true),
}));

describe("NotificationService RBAC", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should block notification if recipient role does not match user role", async () => {
        // Setup: User is INSTITUTION_ADMIN, but notification is for QCTO_ADMIN
        (prisma.user.findUnique as any).mockResolvedValue({
            role: "INSTITUTION_ADMIN",
            email: "test@example.com"
        });

        const result = await NotificationService.send({
            userId: "user-123",
            type: "SYSTEM_ALERT",
            title: "Test",
            message: "Test",
            recipientRole: "QCTO_ADMIN" // Mismatch
        });

        expect(result.skipped).toBe(true);
        expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it("should allow notification if recipient role matches", async () => {
        // Setup: User is INSTITUTION_ADMIN, and notification is for INSTITUTION_ADMIN
        (prisma.user.findUnique as any).mockResolvedValue({
            role: "INSTITUTION_ADMIN",
            email: "test@example.com"
        });

        (prisma.notification.create as any).mockResolvedValue({ notification_id: "n-1" });

        const result = await NotificationService.send({
            userId: "user-123",
            type: "SYSTEM_ALERT",
            title: "Test",
            message: "Test",
            recipientRole: "INSTITUTION_ADMIN" // Match
        });

        expect(result.skipped).toBeUndefined();
        expect(prisma.notification.create).toHaveBeenCalled();
    });

    it("should process correctly without role restriction", async () => {
        (prisma.user.findUnique as any).mockResolvedValue({
            role: "ANY_ROLE",
            email: "test@example.com"
        });
        (prisma.notification.create as any).mockResolvedValue({ notification_id: "n-1" });

        const result = await NotificationService.send({
            userId: "user-123",
            type: "SYSTEM_ALERT",
            title: "Test",
            message: "Test",
            // No recipientRole specified
        });

        expect(prisma.notification.create).toHaveBeenCalled();
    });
});

/**
 * Tests for validation utilities
 */
import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  isValidEmail,
  isValidUUID,
  isValidURL,
  isValidInteger,
  isValidDate,
  isValidFileType,
  isValidFileSize,
  validatePagination,
  containsSQLInjection,
} from "../validation";

describe("validation utilities", () => {
  describe("sanitizeString", () => {
    it("should trim whitespace", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
    });

    it("should remove control characters", () => {
      expect(sanitizeString("hello\x00world")).toBe("hello world");
    });

    it("should normalize whitespace", () => {
      expect(sanitizeString("hello    world")).toBe("hello world");
    });

    it("should respect maxLength", () => {
      expect(sanitizeString("hello world", 5)).toBe("hello");
    });

    it("should handle null/undefined", () => {
      expect(sanitizeString(null)).toBe("");
      expect(sanitizeString(undefined)).toBe("");
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@example.co.za")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    it("should reject emails longer than 254 characters", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe("isValidUUID", () => {
    it("should validate correct UUIDs", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      expect(isValidUUID("not-a-uuid")).toBe(false);
      expect(isValidUUID("550e8400-e29b-41d4-a716")).toBe(false);
      expect(isValidUUID("")).toBe(false);
    });
  });

  describe("isValidURL", () => {
    it("should validate HTTP/HTTPS URLs", () => {
      expect(isValidURL("http://example.com")).toBe(true);
      expect(isValidURL("https://example.com")).toBe(true);
    });

    it("should reject non-HTTP URLs", () => {
      expect(isValidURL("ftp://example.com")).toBe(false);
      expect(isValidURL("javascript:alert(1)")).toBe(false);
    });

    it("should reject invalid URLs", () => {
      expect(isValidURL("not-a-url")).toBe(false);
      expect(isValidURL("")).toBe(false);
    });
  });

  describe("isValidInteger", () => {
    it("should validate integers within range", () => {
      expect(isValidInteger(5, 1, 10)).toBe(true);
      expect(isValidInteger("5", 1, 10)).toBe(true);
    });

    it("should reject out-of-range integers", () => {
      expect(isValidInteger(15, 1, 10)).toBe(false);
      expect(isValidInteger(0, 1, 10)).toBe(false);
    });

    it("should reject non-integers", () => {
      expect(isValidInteger("abc")).toBe(false);
      expect(isValidInteger(3.14)).toBe(false);
    });
  });

  describe("isValidDate", () => {
    it("should validate date strings", () => {
      expect(isValidDate("2024-01-01")).toBe(true);
      expect(isValidDate("2024-01-01T00:00:00Z")).toBe(true);
    });

    it("should reject invalid dates", () => {
      expect(isValidDate("invalid")).toBe(false);
      expect(isValidDate("2024-13-01")).toBe(false);
    });
  });

  describe("isValidFileType", () => {
    it("should validate allowed file types", () => {
      expect(isValidFileType("document.pdf", ["pdf", "doc"])).toBe(true);
      expect(isValidFileType("image.jpg", ["jpg", "png"])).toBe(true);
    });

    it("should reject disallowed file types", () => {
      expect(isValidFileType("script.exe", ["pdf", "doc"])).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isValidFileType("DOCUMENT.PDF", ["pdf"])).toBe(true);
    });
  });

  describe("isValidFileSize", () => {
    it("should validate file sizes within limit", () => {
      expect(isValidFileSize(1024 * 1024, 5)).toBe(true); // 1MB < 5MB
    });

    it("should reject files exceeding limit", () => {
      expect(isValidFileSize(10 * 1024 * 1024, 5)).toBe(false); // 10MB > 5MB
    });
  });

  describe("validatePagination", () => {
    it("should validate correct pagination params", () => {
      const result = validatePagination(10, 0);
      expect(result.valid).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should clamp limit to max 200", () => {
      const result = validatePagination(500, 0);
      expect(result.limit).toBe(50); // Default
    });

    it("should use defaults for invalid params", () => {
      const result = validatePagination("invalid", "invalid");
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });
  });

  describe("containsSQLInjection", () => {
    it("should detect SQL injection patterns", () => {
      expect(containsSQLInjection("'; DROP TABLE users; --")).toBe(true);
      expect(containsSQLInjection("1' OR '1'='1")).toBe(true);
      expect(containsSQLInjection("admin'--")).toBe(true);
    });

    it("should not flag normal strings", () => {
      expect(containsSQLInjection("hello world")).toBe(false);
      expect(containsSQLInjection("user@example.com")).toBe(false);
    });
  });
});

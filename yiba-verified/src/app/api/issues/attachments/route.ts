import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { randomBytes } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

/**
 * POST /api/issues/attachments
 * Upload an attachment for an issue report
 */
export async function POST(req: NextRequest) {
  try {
    const { ctx } = await requireAuth(req);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const issueId = formData.get("issueId") as string | null;

    if (!file || !issueId) {
      return NextResponse.json(
        { error: "File and issueId are required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images and PDFs are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB." },
        { status: 400 }
      );
    }

    // Verify the issue exists and belongs to the user (or user is admin)
    const issue = await prisma.issueReport.findUnique({
      where: { id: issueId },
      select: { reportedBy: true },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const isAdmin = ctx.role === "PLATFORM_ADMIN";
    const isReporter = issue.reportedBy === ctx.userId;

    if (!isAdmin && !isReporter) {
      return NextResponse.json(
        { error: "Not authorized to add attachments to this issue" },
        { status: 403 }
      );
    }

    // Generate a unique storage key
    const ext = path.extname(file.name) || getExtensionFromMimeType(file.type);
    const storageKey = `issues/${issueId}/${randomBytes(16).toString("hex")}${ext}`;

    // For development, save to local file system
    // In production, you would upload to S3/GCS/etc.
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "issues", issueId);
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, `${randomBytes(16).toString("hex")}${ext}`);
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(arrayBuffer));

    // Create attachment record
    const attachment = await prisma.issueAttachment.create({
      data: {
        issueId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storageKey: filePath.replace(path.join(process.cwd(), "public"), ""),
      },
    });

    return NextResponse.json({
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
      },
    });
  } catch (error: any) {
    console.error("Error uploading attachment:", error);
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
  };
  return map[mimeType] || "";
}

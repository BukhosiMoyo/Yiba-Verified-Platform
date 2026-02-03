// File storage abstraction
// Supports both S3 (production) and local filesystem (development)

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import fs from "fs/promises";
import path from "path";
import { ReadableStream } from "stream/web";

export interface StorageConfig {
  provider: "s3" | "local";
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  localPath?: string; // For local storage
}

export interface UploadResult {
  storageKey: string;
  url?: string; // S3 URL or local file path
}

export interface DownloadResult {
  stream: ReadableStream<Uint8Array> | Readable;
  contentType: string;
  contentLength: number;
}

/**
 * Storage service abstraction
 * Handles file uploads/downloads with S3 or local filesystem
 */
export class StorageService {
  private config: StorageConfig;
  private s3Client: S3Client | null = null;

  constructor(config: StorageConfig) {
    this.config = config;

    if (config.provider === "s3") {
      if (!config.bucket || !config.region) {
        throw new Error("S3 storage requires bucket and region to be configured");
      }

      this.s3Client = new S3Client({
        region: config.region,
        credentials: config.accessKeyId && config.secretAccessKey
          ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
          : undefined, // Will use IAM role if not provided
      });
    } else if (config.provider === "local") {
      if (!config.localPath) {
        throw new Error("Local storage requires localPath to be configured");
      }
    }
  }

  /**
   * Upload a file buffer to storage
   */
  async upload(buffer: Buffer, storageKey: string, contentType?: string, isPublic: boolean = false): Promise<UploadResult> {
    if (this.config.provider === "s3") {
      return await this.uploadToS3(buffer, storageKey, contentType, isPublic);
    } else {
      return await this.uploadToLocal(buffer, storageKey);
    }
  }

  /**
   * Download a file from storage
   */
  async download(storageKey: string): Promise<DownloadResult> {
    if (this.config.provider === "s3") {
      return await this.downloadFromS3(storageKey);
    } else {
      return await this.downloadFromLocal(storageKey);
    }
  }

  /**
   * Delete a file from storage
   */
  async delete(storageKey: string): Promise<void> {
    if (this.config.provider === "s3") {
      await this.deleteFromS3(storageKey);
    } else {
      await this.deleteFromLocal(storageKey);
    }
  }

  /**
   * Generate a presigned URL for temporary access (S3 only)
   */
  async getPresignedUrl(storageKey: string, expiresIn: number = 3600): Promise<string | null> {
    if (this.config.provider !== "s3" || !this.s3Client || !this.config.bucket) {
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: storageKey,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // S3 implementation
  private async uploadToS3(buffer: Buffer, storageKey: string, contentType?: string, isPublic: boolean = false): Promise<UploadResult> {
    if (!this.s3Client || !this.config.bucket) {
      throw new Error("S3 client not initialized");
    }

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
      ServerSideEncryption: "AES256",
      // Only set public-read if explicitly requested
      ACL: isPublic ? "public-read" : undefined,
    });

    await this.s3Client.send(command);

    return {
      storageKey,
      url: `s3://${this.config.bucket}/${storageKey}`,
    };
  }

  private async downloadFromS3(storageKey: string): Promise<DownloadResult> {
    if (!this.s3Client || !this.config.bucket) {
      throw new Error("S3 client not initialized");
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: storageKey,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error("File not found in S3");
    }

    // Convert S3 stream to ReadableStream for browser compatibility
    const stream = response.Body as Readable;
    const contentType = response.ContentType || "application/octet-stream";
    const contentLength = response.ContentLength || 0;

    return {
      stream,
      contentType,
      contentLength,
    };
  }

  private async deleteFromS3(storageKey: string): Promise<void> {
    if (!this.s3Client || !this.config.bucket) {
      throw new Error("S3 client not initialized");
    }

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: storageKey,
    });

    await this.s3Client.send(command);
  }

  // Local filesystem implementation
  private async uploadToLocal(buffer: Buffer, storageKey: string): Promise<UploadResult> {
    if (!this.config.localPath) {
      throw new Error("Local storage path not configured");
    }

    const filePath = path.join(this.config.localPath, storageKey);
    const dirPath = path.dirname(filePath);

    // Create directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    return {
      storageKey,
      url: filePath,
    };
  }

  private async downloadFromLocal(storageKey: string): Promise<DownloadResult> {
    if (!this.config.localPath) {
      throw new Error("Local storage path not configured");
    }

    const filePath = path.join(this.config.localPath, storageKey);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new Error("File not found");
    }

    // Read file stats for content length
    const stats = await fs.stat(filePath);
    const buffer = await fs.readFile(filePath);

    // Create a Readable stream from buffer
    const stream = Readable.from(buffer);

    // Try to determine content type from extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".txt": "text/plain",
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";

    return {
      stream,
      contentType,
      contentLength: stats.size,
    };
  }

  private async deleteFromLocal(storageKey: string): Promise<void> {
    if (!this.config.localPath) {
      throw new Error("Local storage path not configured");
    }

    const filePath = path.join(this.config.localPath, storageKey);

    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      // File doesn't exist, which is fine for deletion
    }
  }
}

/**
 * Get storage service instance from environment variables
 */
export function getStorageService(): StorageService {
  let provider = (process.env.STORAGE_PROVIDER || "local") as "s3" | "local";

  // Auto-detect S3 if AWS credentials are present but provider is not explicitly set
  if (!process.env.STORAGE_PROVIDER && (process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET)) {
    provider = "s3";
  }

  const config: StorageConfig = {
    provider,
  };

  if (provider === "s3") {
    config.bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
    config.region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
    config.accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    config.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  } else {
    // Local storage - use ./storage/uploads directory
    config.localPath = process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), "storage", "uploads");
  }

  return new StorageService(config);
}

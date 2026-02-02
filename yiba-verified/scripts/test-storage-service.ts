
import { getStorageService } from "../src/lib/storage";
import fs from "fs";
import path from "path";

// Manually load env since we are running via tsx outside of Next.js context
import dotenv from "dotenv";
dotenv.config();

async function testStorageService() {
    console.log("Testing Storage Service...");

    try {
        const storage = getStorageService();
        // Use reflection to peek at private config for verification logging
        const config = (storage as any).config;

        console.log(`Provider: ${config.provider}`);
        if (config.provider === 's3') {
            console.log(`Bucket: ${config.bucket}`);
            console.log(`Region: ${config.region}`);
            console.log(`Access Key Present: ${!!config.accessKeyId}`);
        } else {
            console.log(`Local Path: ${config.localPath}`);
        }

        if (config.provider !== 's3') {
            console.error("❌ FAILURE: Provider is not S3 but we expected it to be configured for S3.");
            return;
        }

        const testFileName = `test-upload-${Date.now()}.txt`;
        const testContent = "This is a test file uploaded via the storage service.";
        const buffer = Buffer.from(testContent);

        console.log(`\nAttempting to upload ${testFileName}...`);
        const result = await storage.upload(buffer, `tests/${testFileName}`, "text/plain");

        console.log("✅ Upload successful!");
        console.log("Result:", result);

        console.log("\nAttempting to download/read file...");
        const download = await storage.download(result.storageKey);
        console.log(`✅ Download stream obtained. Content Type: ${download.contentType}`);

        console.log("\nAttempting to delete file...");
        await storage.delete(result.storageKey);
        console.log("✅ Delete successful!");

        console.log("\n🎉 Storage Service Verification Complete!");

    } catch (error: any) {
        console.error("❌ Error during test:", error);
    }
}

testStorageService();

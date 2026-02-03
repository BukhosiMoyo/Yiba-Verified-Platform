
import { S3Client, PutPublicAccessBlockCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const bucketName = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
    console.error("❌ Missing AWS credentials in .env");
    process.exit(1);
}

const client = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

async function fixPermissions() {
    console.log(`Configuring public access for bucket: ${bucketName}...`);

    // 1. Disable "Block Public Access" settings that prevent public policies
    try {
        console.log("Disabling Block Public Access (Policy blocking)...");
        await client.send(new PutPublicAccessBlockCommand({
            Bucket: bucketName,
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: false,       // Allow ACLs (optional, but good for legacy)
                IgnorePublicAcls: false,      // Respect ACLs
                BlockPublicPolicy: false,     // Allow public bucket policies containing "Principal": "*"
                RestrictPublicBuckets: false, // Don't restrict public buckets
            },
        }));
        console.log("✅ Block Public Access settings updated.");
    } catch (error) {
        console.error("❌ Failed to update Block Public Access:", error);
    }

    // 2. Set Bucket Policy for Public Read
    try {
        console.log("Setting Bucket Policy for Public Read...");
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "PublicReadGetObject",
                    Effect: "Allow",
                    Principal: "*",
                    Action: "s3:GetObject",
                    Resource: `arn:aws:s3:::${bucketName}/*`,
                },
            ],
        };

        await client.send(new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(policy),
        }));
        console.log("✅ Bucket Policy updated successfully.");
    } catch (error) {
        console.error("❌ Failed to set Bucket Policy:", error);
    }
}

fixPermissions();


import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
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

async function configureCors() {
    console.log(`Setting CORS policy for bucket: ${bucketName}...`);

    const command = new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                    AllowedOrigins: [
                        "http://localhost:3000",
                        "https://yibaverified.co.za",
                        "https://*.vercel.app"
                    ],
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3000,
                },
            ],
        },
    });

    try {
        await client.send(command);
        console.log("✅ Successfully configured CORS policy!");
    } catch (error) {
        console.error("❌ Failed to configure CORS:", error);
    }
}

configureCors();

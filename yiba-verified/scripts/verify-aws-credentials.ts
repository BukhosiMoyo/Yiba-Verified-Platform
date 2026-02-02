
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Simple .env parser since dotenv might not be installed
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), ".env");
        const envFile = fs.readFileSync(envPath, "utf8");
        const envVars: Record<string, string> = {};
        envFile.split("\n").forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                envVars[match[1].trim()] = value;
            }
        });
        return envVars;
    } catch (e) {
        console.error("Could not read .env file");
        return {};
    }
}

async function verifyS3() {
    const env = loadEnv();

    console.log("Checking AWS configuration in .env...");

    const region = env["AWS_REGION"];
    const bucket = env["AWS_S3_BUCKET_NAME"];
    const accessKeyId = env["AWS_ACCESS_KEY_ID"];
    const secretAccessKey = env["AWS_SECRET_ACCESS_KEY"];

    if (!accessKeyId || !secretAccessKey || !bucket || !region) {
        console.error("❌ Missing AWS environment variables.");
        console.log("Found:", { region, bucket, hasAccessKey: !!accessKeyId, hasSecretKey: !!secretAccessKey });
        return;
    }

    console.log(`✅ Found AWS config for bucket: ${bucket} in ${region}`);

    try {
        const client = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        console.log("Attempting to list objects in bucket...");
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            MaxKeys: 5,
        });

        const response = await client.send(command);
        console.log("✅ Successfully connected to S3!");
        console.log(`Found ${response.KeyCount || 0} objects.`);

    } catch (error: any) {
        console.error("❌ Failed to connect to S3:", error.message);
        if (error.name === "InvalidAccessKeyId") {
            console.error("The Access Key ID is invalid.");
        }
    }
}

verifyS3();

import { NextRequest, NextResponse } from "next/server";
import { processInviteCsv } from "@/lib/csv-processor";

export async function POST(request: NextRequest) {
    try {
        console.log("Starting CSV validation request");
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            console.warn("No file uploaded in request");
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        console.log(`File received: ${file.name}, size: ${file.size} bytes`);

        const text = await file.text();
        console.log(`File content read, length: ${text.length} chars`);

        if (!text || text.trim().length === 0) {
            console.warn("File is empty");
            return NextResponse.json(
                { error: "File is empty" },
                { status: 400 }
            );
        }

        console.log("Processing CSV content...");
        const result = processInviteCsv(text);
        console.log(`CSV processing complete. Valid: ${result.valid.length}, Invalid: ${result.invalid.length}`);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("CRITICAL ERROR in CSV validation:");
        console.error(error);
        if (error.stack) console.error(error.stack);

        return NextResponse.json(
            {
                error: "Failed to process CSV file",
                details: error.message || "Unknown error",
                type: error.constructor.name
            },
            { status: 500 }
        );
    }
}

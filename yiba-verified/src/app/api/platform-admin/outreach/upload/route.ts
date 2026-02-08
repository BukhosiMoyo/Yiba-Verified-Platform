import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStorageService } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "PLATFORM_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename, contentType, size } = await req.json();

        if (!filename) {
            return NextResponse.json({ error: "Filename is required" }, { status: 400 });
        }

        // Basic validation
        if (!contentType || !contentType.includes("csv")) {
            // Allow it but warn? Or strictly enforce text/csv?
            // Some browsers send application/vnd.ms-excel for CSV.
            // We'll trust the extension more than the content type for now, but pass it to S3.
        }

        const storage = getStorageService();
        const importId = uuidv4();
        const key = `outreach-imports/${importId}/${filename}`;

        const url = await storage.getPresignedUploadUrl(key, contentType || "text/csv", 3600);

        if (!url) {
            return NextResponse.json({ error: "Storage configuration error (S3 not configured?)" }, { status: 500 });
        }

        return NextResponse.json({
            url,
            key,
            importId, // Useful for grouping if needed
            filename
        });

    } catch (error: any) {
        console.error("Upload presign error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

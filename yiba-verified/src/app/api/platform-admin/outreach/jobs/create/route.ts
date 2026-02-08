import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "PLATFORM_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename, s3Key, size } = await req.json();

        if (!filename || !s3Key) {
            return NextResponse.json({ error: "Filename and S3 Key are required" }, { status: 400 });
        }

        // Create the Job record
        const job = await prisma.outreachImportJob.create({
            data: {
                created_by_user_id: session.user.userId, // session.user.id or userId? Type def says userId.
                original_filename: filename,
                s3_key: s3Key,
                status: "UPLOADED",
                source_type: "CSV_UPLOAD",
                // total_rows is unknown until validation phase
            }
        });

        return NextResponse.json({ job });

    } catch (error: any) {
        console.error("Create Job error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage";
import { parse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";

// Helper to validate email (loose regex)
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = params.id;
    const { action } = await req.json(); // 'VALIDATE' or 'IMPORT'

    try {
        const job = await prisma.outreachImportJob.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // --- PHASE 1: VALIDATION ---
        if (action === "VALIDATE") {
            if (job.status === "PROCESSING" || job.status === "COMPLETED") {
                return NextResponse.json({ job, done: true, progress: 100 });
            }

            // Update status to VALIDATING if not already
            if (job.status === "UPLOADED") {
                await prisma.outreachImportJob.update({
                    where: { id: jobId },
                    data: { status: "VALIDATING" }
                });
            }

            // Download and Parse CSV
            const storage = getStorageService();
            const { stream } = await storage.download(job.s3_key);
            // Convert stream to buffer manually
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const fileBuffer = Buffer.concat(chunks);
            const fileContent = fileBuffer.toString("utf-8");

            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true,
                bom: true,
            });

            const totalRows = records.length;

            // Update total rows if not set
            if (job.total_rows === 0) {
                await prisma.outreachImportJob.update({
                    where: { id: jobId },
                    data: { total_rows: totalRows }
                });
            }

            // Chunk Logic
            const BATCH_SIZE = 1000;
            const start = job.processed_rows;
            const end = Math.min(start + BATCH_SIZE, totalRows);
            const chunk = records.slice(start, end);

            if (chunk.length === 0) {
                return NextResponse.json({ job, done: true, progress: 100 });
            }

            let validCount = 0;
            let invalidCount = 0;
            let duplicateCount = 0;
            let existsCount = 0;

            // --- OPTIMIZATION START ---
            // 1. Pre-process chunk to gather all normalized emails
            const chunkEmails = new Set<string>();
            const rowEmailsMap = new Map<number, string[]>();
            const rowDataMap = new Map<number, { institution: string | null, emails: string[] }>();

            for (let i = 0; i < chunk.length; i++) {
                const row = chunk[i];
                const rowIndex = start + i + 1;

                // Extract emails
                const emails: string[] = [];
                Object.values(row).forEach((val: any) => {
                    if (typeof val === 'string' && val.includes('@')) {
                        val.split(/[;, ]+/).forEach((part: string) => {
                            const e = part.trim().toLowerCase().replace(/[;,.]+$/, '');
                            if (isValidEmail(e)) emails.push(e);
                        });
                    }
                });
                const uniqueEmails = Array.from(new Set(emails));
                uniqueEmails.forEach(e => chunkEmails.add(e));
                rowEmailsMap.set(rowIndex, uniqueEmails);

                // Determine Institution
                let institutionName: string | null = null;
                const orgKeys = Object.keys(row).filter(k => /org|company|institution|provider|name/i.test(k));
                for (const k of orgKeys) {
                    if (row[k]) {
                        institutionName = row[k];
                        break;
                    }
                }
                rowDataMap.set(rowIndex, { institution: institutionName, emails: uniqueEmails });
            }

            // 2. Bulk Fetch Existing Data
            const emailArray = Array.from(chunkEmails);

            // a) Check duplicates in previous chunks (or same job)
            const existingJobItems = await prisma.outreachImportJobItem.findMany({
                where: {
                    job_id: jobId,
                    email_normalized: { in: emailArray },
                    status: { in: ["VALID", "DUPLICATE_IN_FILE", "ALREADY_EXISTS_DB"] }
                },
                select: { email_normalized: true, row_number: true }
            });
            const existingJobItemsMap = new Map(existingJobItems.map(item => [item.email_normalized!, item.row_number]));

            // b) Check duplicates in DB (Invites)
            const existingInvites = await prisma.invite.findMany({
                where: { email: { in: emailArray } },
                select: { email: true }
            });
            const existingInvitesSet = new Set(existingInvites.map(inv => inv.email));

            // 3. Process Rows with Cached Data
            // We also need to track duplicates *within* the current chunk
            const seenInChunk = new Set<string>();

            const newItemsData = [];

            for (let i = 0; i < chunk.length; i++) {
                const rowIndex = start + i + 1;
                const { institution, emails } = rowDataMap.get(rowIndex)!;

                if (emails.length === 0) {
                    newItemsData.push({
                        job_id: jobId,
                        row_number: rowIndex,
                        institution_name_raw: institution,
                        status: "INVALID_EMAIL" as const,
                        reason: "No valid emails found",
                    });
                    invalidCount++;
                    continue;
                }

                for (const email of emails) {
                    // Check duplicate in previous chunks
                    if (existingJobItemsMap.has(email)) {
                        newItemsData.push({
                            job_id: jobId,
                            row_number: rowIndex,
                            institution_name_raw: institution,
                            email_raw: email,
                            email_normalized: email,
                            status: "DUPLICATE_IN_FILE" as const,
                            reason: `Duplicate of row ${existingJobItemsMap.get(email)}`
                        });
                        duplicateCount++;
                        continue;
                    }

                    // Check duplicate in current chunk
                    if (seenInChunk.has(email)) {
                        newItemsData.push({
                            job_id: jobId,
                            row_number: rowIndex,
                            institution_name_raw: institution,
                            email_raw: email,
                            email_normalized: email,
                            status: "DUPLICATE_IN_FILE" as const,
                            reason: `Duplicate in current batch`
                        });
                        duplicateCount++;
                        continue;
                    }

                    // Check existing in DB
                    if (existingInvitesSet.has(email)) {
                        newItemsData.push({
                            job_id: jobId,
                            row_number: rowIndex,
                            institution_name_raw: institution,
                            email_raw: email,
                            email_normalized: email,
                            status: "ALREADY_EXISTS_DB" as const,
                            reason: "Invite already exists"
                        });
                        existsCount++;
                        seenInChunk.add(email); // Mark as seen so subsequent dupes are caught
                        continue;
                    }

                    // Valid
                    newItemsData.push({
                        job_id: jobId,
                        row_number: rowIndex,
                        institution_name_raw: institution,
                        email_raw: email,
                        email_normalized: email,
                        status: "VALID" as const,
                    });
                    validCount++;
                    seenInChunk.add(email);
                }
            }

            // Bulk Create Items
            // Prisma createMany is supported
            if (newItemsData.length > 0) {
                await prisma.outreachImportJobItem.createMany({
                    data: newItemsData
                });
            }
            // --- OPTIMIZATION END ---

            // Update Job Stats
            const updatedJob = await prisma.outreachImportJob.update({
                where: { id: jobId },
                data: {
                    processed_rows: end,
                    valid_emails: { increment: validCount },
                    invalid_emails: { increment: invalidCount },
                    duplicate_in_file: { increment: duplicateCount },
                    already_exists_in_db: { increment: existsCount },
                    total_emails_extracted: { increment: validCount + duplicateCount + existsCount }
                }
            });

            return NextResponse.json({
                job: updatedJob,
                progress: Math.round((end / totalRows) * 100),
                done: end >= totalRows
            });

        }
        // --- PHASE 2: IMPORT ---
        else if (action === "IMPORT") {
            if (job.status === "COMPLETED") return NextResponse.json({ job, done: true });

            if (job.status !== "PROCESSING") {
                await prisma.outreachImportJob.update({
                    where: { id: jobId },
                    data: { status: "PROCESSING" }
                });
            }

            const BATCH_SIZE = 200; // Small batch for writes

            const validItems = await prisma.outreachImportJobItem.findMany({
                where: {
                    job_id: jobId,
                    status: "VALID",
                    invite_id: null
                },
                take: BATCH_SIZE
            });

            if (validItems.length === 0) {
                const completedJob = await prisma.outreachImportJob.update({
                    where: { id: jobId },
                    data: { status: "COMPLETED", completed_at: new Date() }
                });
                return NextResponse.json({ job: completedJob, done: true, progress: 100 });
            }

            let createdCount = 0;
            let failedCount = 0;

            for (const item of validItems) {
                try {
                    // Double check duplicate
                    const existing = await prisma.invite.findFirst({ where: { email: item.email_normalized! } });
                    if (existing) {
                        await prisma.outreachImportJobItem.update({
                            where: { id: item.id },
                            data: { status: "ALREADY_EXISTS_DB", reason: "Found during import phase" }
                        });
                        failedCount++;
                        continue;
                    }

                    // Resolve Institution
                    let institutionId = item.institution_id;
                    if (!institutionId) {
                        // Try find existing by name
                        if (item.institution_name_raw) {
                            const inst = await prisma.institution.findFirst({
                                where: {
                                    OR: [
                                        { legal_name: { equals: item.institution_name_raw, mode: 'insensitive' } },
                                        { trading_name: { equals: item.institution_name_raw, mode: 'insensitive' } }
                                    ]
                                }
                            });
                            if (inst) institutionId = inst.institution_id;
                        }

                        // Create new if not found
                        if (!institutionId) {
                            const newInst = await prisma.institution.create({
                                data: {
                                    legal_name: item.institution_name_raw || "Imported Institution",
                                    institution_type: "OTHER",
                                    province: "Unknown",
                                    physical_address: "Unknown",
                                    registration_number: `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Unique dummy reg
                                }
                            });
                            institutionId = newInst.institution_id;
                        }
                    }

                    // Create Invite
                    const invite = await prisma.invite.create({
                        data: {
                            email: item.email_normalized!,
                            institution_id: institutionId!,
                            role: "INSTITUTION_ADMIN",
                            status: "QUEUED",
                            invited_by: session.user.userId,
                            token: uuidv4(),
                            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        }
                    });

                    await prisma.outreachImportJobItem.update({
                        where: { id: item.id },
                        data: {
                            status: "CREATED",
                            invite_id: invite.invite_id,
                            institution_id: institutionId
                        }
                    });
                    createdCount++;

                } catch (err: any) {
                    console.error("Import item error:", err);
                    await prisma.outreachImportJobItem.update({
                        where: { id: item.id },
                        data: { status: "FAILED_CREATE", reason: err.message }
                    });
                    failedCount++;
                }
            }

            // Update Job
            const updatedJob = await prisma.outreachImportJob.update({
                where: { id: jobId },
                data: {
                    created_invites: { increment: createdCount },
                    failed_creates: { increment: failedCount },
                    processed_emails: { increment: createdCount + failedCount }
                }
            });

            const percent = job.valid_emails > 0 ? Math.round((updatedJob.processed_emails / job.valid_emails) * 100) : 100;

            return NextResponse.json({
                job: updatedJob,
                progress: percent,
                done: false
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Job runner error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

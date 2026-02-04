import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CSV_FILE = "public/Registered Quals & Part-Reg Quals with SAQA links.csv";

// Type mapping helper
function mapQualificationType(typeStr: string): any {
    const norm = typeStr.trim().toLowerCase();

    if (norm.includes("occupational certificate")) return "OCCUPATIONAL_CERTIFICATE";
    if (norm.includes("higher occupational certificate")) return "OCCUPATIONAL_CERTIFICATE";
    if (norm.includes("intermediate occupational certificate")) return "OCCUPATIONAL_CERTIFICATE";
    if (norm.includes("national occupational certificate")) return "OCCUPATIONAL_CERTIFICATE";
    if (norm.includes("elementary occupational certificate")) return "OCCUPATIONAL_CERTIFICATE";

    if (norm.includes("learnership")) return "LEARNERSHIP";
    if (norm.includes("apprenticeship")) return "APPRENTICESHIP";
    if (norm.includes("skill")) return "SKILL_PROGRAMME";
    if (norm.includes("short course")) return "SHORT_COURSE";

    return "OTHER";
}

async function main() {
    console.log(`Reading CSV from ${CSV_FILE}...`);
    const csvPath = path.join(process.cwd(), CSV_FILE);

    if (!fs.existsSync(csvPath)) {
        console.error(`File not found: ${csvPath}`);
        process.exit(1);
    }

    let fileContent = fs.readFileSync(csvPath, "utf-8");
    // Strip BOM if present (0xFEFF)
    if (fileContent.charCodeAt(0) === 0xFEFF) {
        fileContent = fileContent.slice(1);
    }

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }) as any[]; // Cast to any[] to avoid strict type checks on CSV structure

    console.log(`Found ${records.length} records. Processing...`);

    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
        // Handle potential BOM in keys if slice didn't work (double safety)
        const saqaId = record["SAQA Qual ID"] || record["﻿SAQA Qual ID"];
        const title = record["QUALIFICATION TITLE"];
        const typeStr = record["QUALIFICATION TYPE"] || "";
        const nqfStr = record["NQF LEVEL"] || "";
        const creditsStr = record["CREDITS"] || "0";
        const partner = record["QUALITY PARTNER"];

        if (!saqaId || !title) {
            // console.warn(`Skipping invalid record: ${JSON.stringify(record)}`);
            continue;
        }

        // Parse NQF Level (e.g. "NQF Level 4" -> 4)
        let nqfLevel = 1;
        const nqfMatch = nqfStr.match(/\d+/);
        if (nqfMatch) {
            nqfLevel = parseInt(nqfMatch[0], 10);
        }

        const credits = parseInt(creditsStr, 10) || 0;
        const type = mapQualificationType(typeStr);

        try {
            // @ts-ignore
            await prisma.qualification.upsert({
                where: { code: saqaId },
                update: {
                    name: title,
                    type: type,
                    nqf_level: nqfLevel,
                    credits: credits,
                    seta: partner, // Map Quality Partner to SETA
                    saqa_id: saqaId,
                    status: "ACTIVE",
                },
                create: {
                    name: title,
                    code: saqaId,
                    type: type,
                    nqf_level: nqfLevel,
                    credits: credits,
                    seta: partner,
                    saqa_id: saqaId,
                    status: "ACTIVE",
                    study_mode: "ON_SITE",
                    duration_value: 12,
                    duration_unit: "MONTHS"
                }
            });
            process.stdout.write(".");
            successCount++;
        } catch (e) {
            console.error(`\nFailed to import ${saqaId}:`, e);
            errorCount++;
        }
    }

    console.log(`\nImport complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

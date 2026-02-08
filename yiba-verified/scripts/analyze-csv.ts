import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// --- Inline Logic from src/lib/csv-processor.ts ---

interface CsvRow {
    email: string;
    organization?: string;
    emails?: string[];
    [key: string]: any;
}

interface ProcessedInvite {
    email: string;
    organization: string;
    domain: string;
    original_row_index: number;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractOrgFromDomain(domain: string): string {
    if (!domain) return '';
    const parts = domain.split('.');
    if (parts.length > 0) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return domain;
}

function processInviteCsv(csvContent: string) {
    let records: any[] = [];
    try {
        records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
            bom: true,
        });
    } catch (e) {
        throw new Error(`Failed to parse CSV syntax: ${(e as Error).message}`);
    }

    const validInvites: ProcessedInvite[] = [];
    const invalidInvites: any[] = []; // keeping simple
    const seenKeys = new Set<string>();
    const actualDuplicates: string[] = [];

    let duplicateCount = 0;

    records.forEach((row: any, index: number) => {
        const normalizedRow: CsvRow = { email: '' };
        Object.keys(row).forEach(key => {
            const cleanKey = key.toLowerCase().replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
            const value = row[key];
            if (!value) return;

            if (cleanKey.includes('email') || cleanKey === 'e-mail contact 1') {
                const rawEmail = String(value);
                const extractedEmails = rawEmail.split(/[;,]/).map((e: string) => e.trim()).filter((e: string) => isValidEmail(e));

                if (extractedEmails.length > 0) {
                    if (!normalizedRow.emails) normalizedRow.emails = [];
                    normalizedRow.emails.push(...extractedEmails);
                    if (!normalizedRow.email) normalizedRow.email = extractedEmails[0];
                }
            } else if (cleanKey.includes('org') || cleanKey.includes('company') || cleanKey.includes('institution') || cleanKey.includes('skills development provider') || cleanKey === 'provider trading name' || cleanKey === 'provider' || cleanKey.includes('provider')) {
                if (!normalizedRow.organization) normalizedRow.organization = String(value);
            }
        });

        const emailsToProcess = normalizedRow.emails && normalizedRow.emails.length > 0 ? normalizedRow.emails : (normalizedRow.email ? [normalizedRow.email] : []);

        if (emailsToProcess.length === 0) {
            invalidInvites.push({ row_index: index, reason: 'No Email' });
            return;
        }

        emailsToProcess.forEach(emailStr => {
            const email = emailStr.toLowerCase().trim();
            if (!isValidEmail(email)) return;

            const orgKey = normalizedRow.organization ? normalizedRow.organization.toLowerCase().trim() : 'unknown';
            const uniqueKey = `${email}|${orgKey}`;

            if (seenKeys.has(uniqueKey)) {
                duplicateCount++;
                if (actualDuplicates.length < 10) {
                    actualDuplicates.push(`Row ${index}: ${uniqueKey}`);
                }
                return;
            }
            seenKeys.add(uniqueKey);

            const domain = email.split('@')[1];
            validInvites.push({
                email,
                organization: normalizedRow.organization || extractOrgFromDomain(domain) || '',
                domain,
                original_row_index: index
            });
        });
    });

    return {
        stats: {
            total_rows: records.length,
            valid_count: validInvites.length,
            invalid_count: invalidInvites.length,
            duplicate_count: duplicateCount,
        },
        duplicates: actualDuplicates
    };
}
// --- End Inline Logic ---

const filePath = path.join(process.cwd(), 'public/acreeditaton list .csv');

console.log(`\nReading file: ${filePath}`);

try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    console.log(`File read. Size: ${(csvContent.length / 1024 / 1024).toFixed(2)} MB`);

    console.log('Processing CSV...');
    const results = processInviteCsv(csvContent);

    console.log('\n--- Analysis Results ---');
    console.log(`Total Rows: ${results.stats.total_rows}`);
    console.log(`Valid Invites (New Logic): ${results.stats.valid_count}`);
    console.log(`Invalid Rows: ${results.stats.invalid_count}`);
    console.log(`Duplicates (Skipped): ${results.stats.duplicate_count}`);

    if (results.duplicates.length > 0) {
        console.log('\n--- First 10 Actual Duplicates (Row Index | Key) ---');
        results.duplicates.forEach(d => console.log(d));
    }

} catch (err) {
    console.error('Error:', err);
}

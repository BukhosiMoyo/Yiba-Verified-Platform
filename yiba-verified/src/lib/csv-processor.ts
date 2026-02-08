import { parse } from 'csv-parse/sync';

export interface CsvRow {
    email: string;
    first_name?: string;
    last_name?: string;
    organization?: string;
    role?: string;
    physical_address?: string;
    accreditation_start_date?: string;
    accreditation_end_date?: string;
    programmes?: string;
    emails?: string[];
    [key: string]: any;
}

export interface CsvValidationResult {
    valid: ProcessedInvite[];
    invalid: InvalidInvite[];
    stats: {
        total_rows: number;
        valid_count: number;
        invalid_count: number;
        duplicate_count: number;
        unique_organizations: number;
    };
    grouped_by_domain: Record<string, ProcessedInvite[]>;
}

export interface ProcessedInvite {
    email: string;
    first_name: string;
    last_name: string;
    organization: string;
    domain: string;
    phone_number?: string;
    role: string;
    original_row_index: number;
    // Extended fields
    physical_address?: string;
    accreditation_start_date?: string;
    accreditation_end_date?: string;
    programmes?: string;
}

export interface InvalidInvite {
    row: CsvRow;
    reason: string;
    row_index: number;
}

/**
 * Clean and process uploaded CSV content
 */
export function processInviteCsv(csvContent: string): CsvValidationResult {
    // Parse CSV
    // Parse CSV
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
    const invalidInvites: InvalidInvite[] = [];
    const seenEmails = new Set<string>();
    const duplicates = new Set<string>();
    const domains = new Set<string>();

    let duplicateCount = 0;

    records.forEach((row: any, index: number) => {
        // Normalize keys (case insensitive)
        const normalizedRow: CsvRow = { email: '' };
        Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase();
            // Email mapping
            if (lowerKey.includes('email') || lowerKey === 'e-mail contact 1') {
                // Handle multiple emails separated by ; or ,
                const rawEmail = row[key];
                if (rawEmail) {
                    const extractedEmails = rawEmail.split(/[;,]/).map((e: string) => e.trim()).filter((e: string) => isValidEmail(e));

                    if (extractedEmails.length > 0) {
                        if (!normalizedRow.emails) normalizedRow.emails = [];
                        normalizedRow.emails.push(...extractedEmails);
                        if (!normalizedRow.email) normalizedRow.email = extractedEmails[0];
                    }
                }
            }
            // Name mapping
            else if (lowerKey.includes('first') && lowerKey.includes('name')) normalizedRow.first_name = row[key];
            else if (lowerKey.includes('last') && lowerKey.includes('name')) normalizedRow.last_name = row[key];
            else if (lowerKey === 'name' || lowerKey === 'contact person' || lowerKey === 'contact person names') {
                const parts = (row[key] || '').split(' ');
                normalizedRow.first_name = parts[0];
                normalizedRow.last_name = parts.slice(1).join(' ');
            }
            // Organization mapping
            else if (lowerKey.includes('org') || lowerKey.includes('company') || lowerKey.includes('institution') || lowerKey === 'skills development provider' || lowerKey === 'provider trading name') {
                normalizedRow.organization = row[key];
            }
            // Phone mapping
            else if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('cell') || lowerKey === 'contact number2') {
                normalizedRow.phone_number = row[key];
            }
            // Role mapping
            else if (lowerKey.includes('role') || lowerKey.includes('job')) normalizedRow.role = row[key];
            // QCTO Extended mapping
            else if (lowerKey.includes('physical') && lowerKey.includes('address')) normalizedRow.physical_address = row[key];
            else if (lowerKey.includes('programme') || lowerKey.includes('qualification')) normalizedRow.programmes = row[key];
            else if (lowerKey.includes('accreditation') && lowerKey.includes('start')) normalizedRow.accreditation_start_date = row[key];
            else if (lowerKey.includes('accreditation') && lowerKey.includes('end')) normalizedRow.accreditation_end_date = row[key];
        });

        // Validate Emails
        const emailsToProcess = normalizedRow.emails && normalizedRow.emails.length > 0 ? normalizedRow.emails : (normalizedRow.email ? [normalizedRow.email] : []);

        if (emailsToProcess.length === 0) {
            invalidInvites.push({
                row: normalizedRow,
                reason: 'Missing or invalid email',
                row_index: index
            });
            return;
        }

        // Iterate all found emails
        emailsToProcess.forEach(emailStr => {
            const email = emailStr.toLowerCase().trim();
            if (!isValidEmail(email)) return;

            // Deduplicate by Email + Organization
            const orgKey = normalizedRow.organization ? normalizedRow.organization.toLowerCase().trim() : 'unknown';
            const uniqueKey = `${email}|${orgKey}`;

            if (seenEmails.has(uniqueKey)) {
                duplicateCount++;
                return;
            }
            seenEmails.add(uniqueKey);

            // Extract Domain
            const domain = email.split('@')[1];
            if (domain) domains.add(domain);

            validInvites.push({
                email,
                first_name: normalizedRow.first_name || '',
                last_name: normalizedRow.last_name || '',
                organization: normalizedRow.organization || extractOrgFromDomain(domain) || '',
                domain,
                phone_number: normalizedRow.phone_number || '',
                role: normalizedRow.role || '',
                original_row_index: index,
                // Extended fields
                physical_address: normalizedRow.physical_address,
                accreditation_start_date: normalizedRow.accreditation_start_date,
                accreditation_end_date: normalizedRow.accreditation_end_date,
                programmes: normalizedRow.programmes,
            });
        });
    });

    // Group by domain
    const grouped_by_domain: Record<string, ProcessedInvite[]> = {};
    validInvites.forEach(invite => {
        if (!grouped_by_domain[invite.domain]) {
            grouped_by_domain[invite.domain] = [];
        }
        grouped_by_domain[invite.domain].push(invite);
    });

    return {
        valid: validInvites,
        invalid: invalidInvites,
        stats: {
            total_rows: records.length,
            valid_count: validInvites.length,
            invalid_count: invalidInvites.length,
            duplicate_count: duplicateCount,
            unique_organizations: domains.size,
        },
        grouped_by_domain,
    };
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractOrgFromDomain(domain: string): string {
    if (!domain) return '';
    const parts = domain.split('.');
    if (parts.length > 0) {
        // simple title case of first part (e.g. gmail -> Gmail, yiba -> Yiba)
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return domain;
}

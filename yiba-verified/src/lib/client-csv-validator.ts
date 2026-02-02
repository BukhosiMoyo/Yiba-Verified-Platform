import { CsvRow, CsvValidationResult, ProcessedInvite, InvalidInvite } from "./csv-processor";

/**
 * Client-side version of processInviteCsv that works with parsed data objects
 * instead of raw string content.
 */
export function validateParsedCsv(records: any[]): CsvValidationResult {
    const validInvites: ProcessedInvite[] = [];
    const invalidInvites: InvalidInvite[] = [];
    const seenEmails = new Set<string>();
    const domains = new Set<string>();

    let duplicateCount = 0;

    records.forEach((row: any, index: number) => {
        // Normalize keys (case insensitive)
        const normalizedRow: CsvRow = { email: '' };
        Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase();
            const value = row[key];
            if (!value) return;

            // Email mapping
            if (lowerKey.includes('email') || lowerKey === 'e-mail contact 1') {
                // Handle multiple emails separated by ; or ,
                const rawEmail = String(value);
                const firstEmail = rawEmail.split(/[;,]/)[0].trim();
                if (!normalizedRow.email) normalizedRow.email = firstEmail;
            }
            // Name mapping
            else if (lowerKey.includes('first') && lowerKey.includes('name')) normalizedRow.first_name = String(value);
            else if (lowerKey.includes('last') && lowerKey.includes('name')) normalizedRow.last_name = String(value);
            else if (lowerKey === 'name' || lowerKey === 'contact person' || lowerKey === 'contact person names') {
                const parts = String(value).split(' ');
                normalizedRow.first_name = parts[0];
                normalizedRow.last_name = parts.slice(1).join(' ');
            }
            // Organization mapping
            else if (lowerKey.includes('org') || lowerKey.includes('company') || lowerKey.includes('institution') || lowerKey === 'skills development provider' || lowerKey === 'provider trading name') {
                normalizedRow.organization = String(value);
            }
            // Phone mapping
            else if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('cell') || lowerKey === 'contact number2') {
                normalizedRow.phone_number = String(value);
            }
            // Role mapping
            else if (lowerKey.includes('role') || lowerKey.includes('job')) normalizedRow.role = String(value);
            // QCTO Extended mapping
            else if (lowerKey.includes('physical') && lowerKey.includes('address')) normalizedRow.physical_address = String(value);
            else if (lowerKey.includes('programme') || lowerKey.includes('qualification')) normalizedRow.programmes = String(value);
            else if (lowerKey.includes('accreditation') && lowerKey.includes('start')) normalizedRow.accreditation_start_date = String(value);
            else if (lowerKey.includes('accreditation') && lowerKey.includes('end')) normalizedRow.accreditation_end_date = String(value);
        });

        // Validate Email
        if (!normalizedRow.email || !isValidEmail(normalizedRow.email)) {
            invalidInvites.push({
                row: normalizedRow,
                reason: normalizedRow.email ? 'Invalid email format' : 'Missing email',
                row_index: index
            });
            return;
        }

        const email = normalizedRow.email.toLowerCase().trim();

        // Deduplicate
        if (seenEmails.has(email)) {
            duplicateCount++;
            return;
        }
        seenEmails.add(email);

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
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return domain;
}

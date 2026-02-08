import { CsvRow, CsvValidationResult, ProcessedInvite, InvalidInvite } from "./csv-processor";

/**
 * Client-side version of processInviteCsv that works with parsed data objects
 * instead of raw string content.
 */
export function validateParsedCsv(records: any[]): CsvValidationResult {
    const validInvites: ProcessedInvite[] = [];
    const invalidInvites: InvalidInvite[] = [];
    const seenKeys = new Set<string>();
    const domains = new Set<string>();

    let duplicateCount = 0;

    records.forEach((row: any, index: number) => {
        // Normalize keys (case insensitive, collapse whitespace)
        const normalizedRow: CsvRow = { email: '' }; // Primary email still needed for existing types, but we will use .emails array
        Object.keys(row).forEach(key => {
            const cleanKey = key.toLowerCase().replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
            const value = row[key];
            if (!value) return;

            // Email mapping
            if (cleanKey.includes('email') || cleanKey === 'e-mail contact 1') {
                // Handle multiple emails separated by ; or ,
                const rawEmail = String(value);
                const extractedEmails = rawEmail.split(/[;,]/).map(e => e.trim()).filter(e => isValidEmail(e));

                if (extractedEmails.length > 0) {
                    if (!normalizedRow.emails) normalizedRow.emails = [];
                    normalizedRow.emails.push(...extractedEmails);
                    // Keep strict first email as primary for fallback/legacy compatibility
                    if (!normalizedRow.email) normalizedRow.email = extractedEmails[0];
                }
            }
            // Name mapping
            else if (cleanKey.includes('first') && cleanKey.includes('name')) normalizedRow.first_name = String(value);
            else if (cleanKey.includes('last') && cleanKey.includes('name')) normalizedRow.last_name = String(value);
            else if ((cleanKey === 'name' || cleanKey === 'contact person' || cleanKey === 'contact person names') && !cleanKey.includes('provider')) {
                const parts = String(value).split(' ');
                normalizedRow.first_name = parts[0];
                normalizedRow.last_name = parts.slice(1).join(' ');
            }
            // Organization mapping
            else if (cleanKey.includes('org') || cleanKey.includes('company') || cleanKey.includes('institution') || cleanKey.includes('skills development provider') || cleanKey === 'provider trading name' || cleanKey === 'provider' || cleanKey.includes('provider')) {
                if (!normalizedRow.organization) normalizedRow.organization = String(value);
            }
            // Phone mapping
            else if (cleanKey.includes('phone') || cleanKey.includes('mobile') || cleanKey.includes('cell') || cleanKey === 'contact number2') {
                normalizedRow.phone_number = String(value);
            }
            // Role mapping
            else if (cleanKey.includes('role') || cleanKey.includes('job')) normalizedRow.role = String(value);
            // QCTO Extended mapping
            else if (cleanKey.includes('physical') && cleanKey.includes('address')) normalizedRow.physical_address = String(value);
            else if (cleanKey.includes('programme') || cleanKey.includes('qualification')) normalizedRow.programmes = String(value);
            else if (cleanKey.includes('accreditation') && cleanKey.includes('start')) normalizedRow.accreditation_start_date = String(value);
            else if (cleanKey.includes('accreditation') && cleanKey.includes('end')) normalizedRow.accreditation_end_date = String(value);
        });

        // Validate Emails
        // If no valid emails found, push 1 invalid record
        const emailsToProcess = normalizedRow.emails && normalizedRow.emails.length > 0 ? normalizedRow.emails : (normalizedRow.email ? [normalizedRow.email] : []);

        if (emailsToProcess.length === 0) {
            invalidInvites.push({
                row: normalizedRow,
                reason: 'Missing or invalid email',
                row_index: index
            });
            return;
        }

        // Iterate all found emails for this row
        emailsToProcess.forEach(emailStr => {
            const email = emailStr.toLowerCase().trim();
            if (!isValidEmail(email)) return; // Should be filtered already but safety check

            // Deduplicate by Email + Organization (allow same email for different branches)
            // If organization is missing, fallback to email only to avoid multi-null dupes
            const orgKey = normalizedRow.organization ? normalizedRow.organization.toLowerCase().trim() : 'unknown';
            const uniqueKey = `${email}|${orgKey}`;

            if (seenKeys.has(uniqueKey)) {
                duplicateCount++;
                return;
            }
            seenKeys.add(uniqueKey);

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
        // Grouping by domain in UI might collapse them visually? 
        // The wizard uses `grouped_by_domain` to display "3 Organizations". 
        // If 3 branches have same domain, they group there. That's fine for display.
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
            unique_organizations: domains.size, // This is count of domains, not orgs. Maybe rename or accept?
        },
        grouped_by_domain,
    };
}

const isValidEmail = (email: string) => {
    if (!email) return false;
    // Explicitly reject if multiple emails are present (comma separated) to allow AI cleaning to handle them
    if (email.includes(',')) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
};

function extractOrgFromDomain(domain: string): string {
    if (!domain) return '';
    const parts = domain.split('.');
    if (parts.length > 0) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return domain;
}

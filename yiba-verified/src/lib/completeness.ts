import { User, Institution } from "@prisma/client";

export type CompletenessResult = {
    percentage: number;
    missingFields: string[];
};

export function calculateUserCompleteness(user: User): CompletenessResult {
    const fields = [
        { key: "first_name", weight: 10, label: "First Name" },
        { key: "last_name", weight: 10, label: "Last Name" },
        { key: "email", weight: 10, label: "Email" },
        { key: "image", weight: 10, label: "Profile Picture" },
        { key: "phone", weight: 20, label: "Phone Number" },
        { key: "default_province", weight: 10, label: "Province" },
        { key: "onboarding_completed", weight: 30, label: "Onboarding" }, // Big chunk if completed
    ];

    let score = 0;
    const maxScore = fields.reduce((acc, f) => acc + f.weight, 0);
    const missing: string[] = [];

    for (const field of fields) {
        const value = (user as any)[field.key];
        if (value && value !== "" && value !== false) {
            score += field.weight;
        } else {
            missing.push(field.label);
        }
    }

    // Normalize to 100
    const percentage = Math.round((score / maxScore) * 100);

    return { percentage, missingFields: missing };
}

export function calculateInstitutionCompleteness(institution: Institution): CompletenessResult {
    const fields = [
        { key: "legal_name", weight: 10, label: "Legal Name" },
        { key: "institution_type", weight: 10, label: "Institution Type" },
        { key: "registration_number", weight: 20, label: "Registration Number" },
        { key: "physical_address", weight: 10, label: "Physical Address" },
        { key: "province", weight: 10, label: "Province" },
        { key: "contact_person_name", weight: 10, label: "Contact Person" },
        { key: "contact_email", weight: 10, label: "Contact Email" },
        { key: "contact_number", weight: 10, label: "Contact Number" },
        { key: "tax_compliance_pin", weight: 10, label: "Tax Compliance PIN" },
    ];

    let score = 0;
    const maxScore = fields.reduce((acc, f) => acc + f.weight, 0);
    const missing: string[] = [];

    for (const field of fields) {
        const value = (institution as any)[field.key];
        if (value && value !== "") {
            score += field.weight;
        } else {
            missing.push(field.label);
        }
    }

    // Normalize
    const percentage = Math.round((score / maxScore) * 100);

    return { percentage, missingFields: missing };
}


import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearData() {
    console.log("Clearing data...");
    const models = [
        'qCTORequest', 'readiness', 'enrolment', 'assessment', 'moduleCompletion',
        'attendanceRecord', 'classSession', 'cohort', 'learner', 'submission',
        'institutionContact', 'invite', 'userInstitution', 'auditLog', 'institution'
    ];

    for (const model of models) {
        try {
            // @ts-ignore
            if (prisma[model]) {
                console.log(`Deleting from ${model}...`);
                // @ts-ignore
                const result = await prisma[model].deleteMany({});
                console.log(`Deleted ${result.count} records from ${model}.`);
            } else {
                console.warn(`Model ${model} not found on Prisma client.`);
            }
        } catch (error) {
            // Ignore foreign key errors on first pass, we might need multiple passes or specific order
            console.error(`Error deleting from ${model}:`, error instanceof Error ? error.message : error);
        }
    }

    // Second pass for specific sticky ones if needed, but let's try a directed dependency order
    // The definition order in schema is usually a good hint, but we need reverse dependency order.

    const order = [
        'assessmentResult', 'assessment',
        'attendanceRecord', 'sickNote',
        'classSession',
        'moduleCompletion',
        'enrolment',
        'cohort',
        'learner',
        'submission',
        'readiness',
        'institutionContact',
        'invite',
        'userInstitution',
        'auditLog',
        'institution'
    ];

    console.log("--- Starting Ordered Deletion ---");
    for (const model of order) {
        try {
            // @ts-ignore
            if (prisma[model]) {
                console.log(`Deleting from ${model}...`);
                // @ts-ignore
                const result = await prisma[model].deleteMany({});
                console.log(`Deleted ${result.count} records from ${model}.`);
            }
        } catch (error) {
            console.error(`Error deleting from ${model}:`, error instanceof Error ? error.message : error);
        }
    }
}

clearData()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

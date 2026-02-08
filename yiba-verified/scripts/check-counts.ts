
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCounts() {
    console.log("Checking DB counts...");
    try {
        const invites = await prisma.invite.count();
        const institutions = await prisma.institution.count();
        const queued = await prisma.invite.count({ where: { status: 'QUEUED' } });

        console.log(`Total Invites: ${invites}`);
        console.log(`Total Institutions: ${institutions}`);
        console.log(`Queued Invites: ${queued}`);

    } catch (error) {
        console.error("Error checking counts:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();

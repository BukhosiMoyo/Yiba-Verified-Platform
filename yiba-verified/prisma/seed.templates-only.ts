import { PrismaClient } from "@prisma/client";
import { seedEmailTemplates } from "./seed.templates";

const prisma = new PrismaClient();

async function main() {
    console.log("📧 Seeding ONLY email templates...");
    await seedEmailTemplates(prisma);
    console.log("✅ Email templates updated.");
}

main()
    .catch((e) => {
        console.error("Error seeding templates:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

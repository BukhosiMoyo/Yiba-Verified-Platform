
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.auditLog.count();
    console.log(`Total Audit Logs: ${count}`);

    if (count > 0) {
        const logs = await prisma.auditLog.findMany({
            take: 5,
            orderBy: { changed_at: "desc" },
            include: {
                changedBy: {
                    select: { email: true, first_name: true, last_name: true }
                }
            }
        });
        console.log("Recent Logs:", JSON.stringify(logs, null, 2));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

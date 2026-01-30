/**
 * Debug script: run the same Prisma query as GET /api/qcto/readiness
 * Run: npx tsx scripts/debug-readiness-api.ts
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const where: any = {
    deleted_at: null,
    readiness_status: { notIn: ["NOT_STARTED", "IN_PROGRESS"] },
  };

  const limit = 10;
  const offset = 0;

  console.log("Query where:", JSON.stringify(where, null, 2));

  const [items, count] = await Promise.all([
    prisma.readiness.findMany({
      where,
      include: {
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
            province: true,
          },
        },
        qualification_registry: {
          select: { id: true, name: true, saqa_id: true, curriculum_code: true, nqf_level: true },
        },
        recommendation: {
          select: {
            recommendation_id: true,
            recommendation: true,
            remarks: true,
            created_at: true,
          },
        },
        _count: { select: { documents: true } },
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.readiness.count({ where }),
  ]);

  console.log("count:", count, "items:", items.length);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkImpersonationTable() {
  try {
    console.log("Checking ImpersonationSession table...");
    
    // Try to query the table
    const count = await prisma.impersonationSession.count();
    console.log(`✓ ImpersonationSession table exists with ${count} records`);
    
    // Check the schema
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ImpersonationSession'
      ORDER BY ordinal_position;
    `;
    
    console.log("\nTable schema:");
    console.log(result);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImpersonationTable();

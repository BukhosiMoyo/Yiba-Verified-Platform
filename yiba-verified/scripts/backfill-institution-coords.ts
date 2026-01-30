/**
 * Backfill latitude/longitude on InstitutionPublicProfile using physical_address + province.
 * Uses Nominatim (1 req/s). Run: npx tsx scripts/backfill-institution-coords.ts
 */
import { PrismaClient } from "@prisma/client";
import { forwardGeocode } from "../src/lib/geocode";

const prisma = new PrismaClient();
const DELAY_MS = 1100; // Nominatim usage policy: max 1 request per second

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const profiles = await prisma.institutionPublicProfile.findMany({
    where: { OR: [{ latitude: null }, { longitude: null }] },
    include: { institution: { select: { physical_address: true, province: true } } },
  });
  console.log(`Found ${profiles.length} profiles without coordinates.`);
  let updated = 0;
  let failed = 0;
  for (const p of profiles) {
    const addr = [p.institution.physical_address, p.institution.province].filter(Boolean).join(", ");
    if (!addr.trim()) {
      failed++;
      continue;
    }
    const coords = await forwardGeocode(addr);
    await sleep(DELAY_MS);
    if (coords) {
      await prisma.institutionPublicProfile.update({
        where: { id: p.id },
        data: { latitude: coords.lat, longitude: coords.lon },
      });
      updated++;
      console.log(`Updated ${p.slug}: ${coords.lat}, ${coords.lon}`);
    } else {
      failed++;
    }
  }
  console.log(`Done. Updated: ${updated}, failed/skipped: ${failed}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

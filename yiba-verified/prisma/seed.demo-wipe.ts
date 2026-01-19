/**
 * Wipe all demo data. Run with DEMO_MODE=true.
 * Usage: DEMO_MODE=true npx tsx prisma/seed.demo-wipe.ts
 *    or: npm run seed:demo:wipe
 */

import { wipeDemoData } from "./seed.demo";

wipeDemoData()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

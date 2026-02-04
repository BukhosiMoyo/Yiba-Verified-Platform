
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getSystemSetting = unstable_cache(
    async (key: string) => {
        try {
            const setting = await prisma.systemSetting.findUnique({
                where: { key },
            });
            return setting?.value ?? null;
        } catch (error) {
            console.error(`Failed to fetch system setting ${key}:`, error);
            return null;
        }
    },
    ["system-settings"],
    { revalidate: 300, tags: ["system-settings"] } // Cache for 5 minutes
);

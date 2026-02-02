"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@prisma/client";

export type CreateAdminResult = {
    success: boolean;
    message: string;
};

export async function createAdminUser(prevState: any, formData: FormData): Promise<CreateAdminResult> {
    const secretCode = formData.get("secretCode") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const role = formData.get("role") as UserRole;

    if (!process.env.ADMIN_SETUP_SECRET) {
        return { success: false, message: "ADMIN_SETUP_SECRET is not configured on the server." };
    }

    if (secretCode !== process.env.ADMIN_SETUP_SECRET) {
        return { success: false, message: "Invalid secret code." };
    }

    if (!email || !password || !firstName || !lastName || !role) {
        return { success: false, message: "All fields are required." };
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { success: false, message: "User with this email already exists." };
        }

        const passwordHash = await hashPassword(password);

        // QCTO Organization logic: if role is QCTO related, try to link to QCTO org
        let qctoId: string | null = null;
        if (role.startsWith("QCTO_")) {
            const qctoOrg = await prisma.qCTOOrg.findFirst();
            if (qctoOrg) {
                qctoId = qctoOrg.id;
            } else {
                // Create if missing (fallback)
                const newOrg = await prisma.qCTOOrg.create({ data: { name: "QCTO" } });
                qctoId = newOrg.id;
            }
        }

        await prisma.user.create({
            data: {
                email,
                password_hash: passwordHash,
                first_name: firstName,
                last_name: lastName,
                role,
                qcto_id: qctoId,
                status: "ACTIVE",
                onboarding_completed: true,
                onboarding_completed_at: new Date(),
                // Platform admins don't need provinces; QCTO users might, but we leave blank for now to be filled later
                verification_level: role === "PLATFORM_ADMIN" ? "BLACK" : "NONE",
                verification_date: role === "PLATFORM_ADMIN" ? new Date() : null,
            },
        });

        return { success: true, message: `User ${email} created successfully as ${role}.` };

    } catch (error) {
        console.error("Error creating admin user:", error);
        return { success: false, message: "Database error. Check server logs." };
    }
}

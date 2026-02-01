
import { DriveStep } from "driver.js";

type TourConfig = {
    [role: string]: DriveStep[];
};

export const TOUR_STEPS: TourConfig = {
    INSTITUTION_ADMIN: [
        {
            element: "#sidebar-home",
            popover: {
                title: "Welcome to Yiba Verified",
                description: "This is your institution's dashboard. Here you can see a high-level overview of your accreditation status and recent activities.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-readiness",
            popover: {
                title: "Readiness Application",
                description: "This is the most important section. Build your Form 5 application here, section by section. You can track your completion progress as you go.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-learners",
            popover: {
                title: "Manage Learners",
                description: "Add and manage your student database here. You'll need to link learners to your enrolments.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-facilitators",
            popover: {
                title: "Facilitators & Assessors",
                description: "Upload profiles for your staff. QCTO requires verified facilitators for your programmes.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-account",
            popover: {
                title: "Your Account",
                description: "Manage your profile settings and log out from here.",
                side: "right",
                align: "start",
            },
        },
    ],
    PLATFORM_ADMIN: [
        {
            element: "#sidebar-home",
            popover: {
                title: "Platform Overview",
                description: "Monitor the health of the entire Yiba Verified ecosystem.",
                side: "right",
                align: "start"
            }
        },
        {
            element: "#sidebar-account",
            popover: {
                title: "Admin Tools",
                description: "Access system-wide settings and logs.",
                side: "right",
                align: "start",
            },
        }
    ],
    QCTO_ADMIN: [],
    STUDENT: [],
};

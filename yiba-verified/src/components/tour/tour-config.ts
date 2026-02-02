
import { DriveStep } from "driver.js";

type TourConfig = {
    [role: string]: DriveStep[];
};

export const TOUR_STEPS: TourConfig = {
    INSTITUTION_ADMIN: [
        {
            element: "#sidebar-home",
            popover: {
                title: "Institution Dashboard",
                description: "Your central hub for accreditation status, recent notifications, and quick actions.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-readiness",
            popover: {
                title: "Readiness Application",
                description: "This is where you build and submit your Form 5 application. Track progress section by section.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-learners",
            popover: {
                title: "Learner Management",
                description: "Add and manage your student database. Enrol learners into qualifications here.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-facilitators",
            popover: {
                title: "Facilitators",
                description: "Upload and verify your academic staff. QCTO requires linked facilitators for all programmes.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-requests",
            popover: {
                title: "QCTO Requests",
                description: "Submit and track service requests directly with the QCTO.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-account",
            popover: {
                title: "Profile & Settings",
                description: "Manage your institution details, users, and account settings.",
                side: "right",
                align: "start",
            },
        },
    ],
    INSTITUTION_STAFF: [
        {
            element: "#sidebar-home",
            popover: {
                title: "Staff Dashboard",
                description: "Overview of your assigned tasks and institution status.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-readiness",
            popover: {
                title: "Readiness Input",
                description: "Contribute to the Form 5 application sections assigned to you.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-learners",
            popover: {
                title: "Learner Records",
                description: "View and update learner profiles and enrolment data.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-account",
            popover: {
                title: "Your Account",
                description: "Update your personal details and logout.",
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
            element: "#sidebar-requests",
            popover: {
                title: "Service Requests",
                description: "Manage incoming support and service tickets from institutions.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-account",
            popover: {
                title: "Admin Tools",
                description: "Access system-wide settings, user management, and audit logs.",
                side: "right",
                align: "start",
            },
        }
    ],
    QCTO_ADMIN: [
        {
            element: "#sidebar-home",
            popover: {
                title: "QCTO Dashboard",
                description: "View pending accreditation requests and assignee workloads.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-requests",
            popover: {
                title: "Requests & Submissions",
                description: "Review and process incoming accreditation and service requests.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-account",
            popover: {
                title: "QCTO Management",
                description: "Manage internal staff and regional settings.",
                side: "right",
                align: "start",
            },
        },
    ],
    QCTO_SUPER_ADMIN: [
        {
            element: "#sidebar-home",
            popover: {
                title: "QCTO Dashboard",
                description: "View pending accreditation requests and assignee workloads.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-account",
            popover: {
                title: "System Management",
                description: "Full control over QCTO configuration and staff access.",
                side: "right",
                align: "start",
            },
        },
    ],
    QCTO_REVIEWER: [
        {
            element: "#sidebar-home",
            popover: {
                title: "Reviewer Dashboard",
                description: "See your assigned applications and upcoming site visits.",
                side: "right",
                align: "start",
            },
        },
    ],
    QCTO_USER: [
        {
            element: "#sidebar-home",
            popover: {
                title: "QCTO Dashboard",
                description: "Access your QCTO tools and views.",
                side: "right",
                align: "start",
            },
        },
    ],
    QCTO_AUDITOR: [
        {
            element: "#sidebar-home",
            popover: {
                title: "Auditor Access",
                description: "Review compliance and audit logs.",
                side: "right",
                align: "start",
            },
        },
    ],
    QCTO_VIEWER: [
        {
            element: "#sidebar-home",
            popover: {
                title: "Viewer Access",
                description: "Read-only access to institution data.",
                side: "right",
                align: "start",
            },
        },
    ],
    ADVISOR: [],
    STUDENT: [
        {
            element: "#sidebar-home",
            popover: {
                title: "Learner Portal",
                description: "View your current enrolments and progress.",
                side: "right",
                align: "start",
            },
        },
        {
            element: "#sidebar-account",
            popover: {
                title: "My Profile",
                description: "Update your personal details and qualifications.",
                side: "right",
                align: "start",
            },
        },
    ],
};

import { PrismaClient, EngagementState } from "@prisma/client";
import { QuestionType, TemplateStatus } from "../src/lib/outreach/types";

const prisma = new PrismaClient();

const QUESTIONNAIRES = [
    {
        slug: "unaware-check-in",
        title: "Just a quick check-in — how do things currently work on your side?",
        description: "These questions help us understand your setup so we can share the right information with you.",
        status: TemplateStatus.PUBLISHED,
        steps: [
            {
                step_id: "step_1",
                order: 1,
                title: "Operational Context",
                copy: "We work with many South African training institutions and no two are the same.",
                icon: "clipboard-list",
                questions: [
                    {
                        question_id: "q_admin_method",
                        type: QuestionType.RADIO,
                        text: "How do you currently handle QCTO-related admin and submissions?",
                        required: true,
                        options: [
                            "Mostly emails, spreadsheets, and documents",
                            "A mix of manual work and some software",
                            "We use a system for most things",
                            "I’m not fully sure — it’s handled by someone else"
                        ]
                    },
                    {
                        question_id: "q_pain_points",
                        type: QuestionType.RADIO,
                        text: "Which of these feels closest to your experience?",
                        required: true,
                        options: [
                            "Submissions usually take longer than expected",
                            "Tracking what was sent and when can be tricky",
                            "Preparing for audits or visits is stressful",
                            "We manage okay, but it takes a lot of time",
                            "None of these really apply"
                        ]
                    },
                    {
                        question_id: "q_responsibility",
                        type: QuestionType.RADIO,
                        text: "Who usually takes responsibility for compliance and reporting?",
                        required: true,
                        options: [
                            "Me",
                            "A small internal team",
                            "An external consultant",
                            "It’s not clearly defined"
                        ]
                    }
                ]
            }
        ]
    },
    {
        slug: "problem-aware-challenges",
        title: "You’re not the only one — many institutions tell us this",
        description: "From colleges to private providers, we hear similar stories across the country. Let’s narrow down what slows things down the most for you.",
        status: TemplateStatus.PUBLISHED,
        steps: [
            {
                step_id: "step_1",
                order: 1,
                title: "Challenges",
                copy: "Let’s narrow down what slows things down the most for you.",
                icon: "alert-triangle",
                questions: [
                    {
                        question_id: "q_delays",
                        type: QuestionType.CHECKBOX,
                        text: "What usually causes the biggest delays?",
                        required: true,
                        options: [
                            "Finding the right documents",
                            "Verifying attendance records",
                            "Rebuilding information for submissions",
                            "Responding to short-notice requests",
                            "Internal back-and-forth between staff"
                        ]
                    },
                    {
                        question_id: "q_confidence",
                        type: QuestionType.RADIO,
                        text: "How confident are you in your records when something is requested?",
                        required: true,
                        options: [
                            "Very confident",
                            "Fairly confident",
                            "Not very confident",
                            "We rely on people remembering"
                        ]
                    },
                    {
                        question_id: "q_preparedness",
                        type: QuestionType.RADIO,
                        text: "If information was requested today, how prepared would you be?",
                        required: true,
                        options: [
                            "Ready immediately",
                            "Would need a few days",
                            "Would require serious preparation",
                            "Not sure"
                        ]
                    }
                ]
            }
        ]
    },
    {
        slug: "solution-aware-needs",
        title: "If things worked better, what would matter most to you?",
        description: "Every institution has different priorities. These questions help us focus on what would actually make a difference for you.",
        status: TemplateStatus.PUBLISHED,
        steps: [
            {
                step_id: "step_1",
                order: 1,
                title: "Priorities",
                copy: "Every institution has different priorities.",
                icon: "star",
                questions: [
                    {
                        question_id: "q_top_help",
                        type: QuestionType.CHECKBOX,
                        text: "What would help you the most right now? (Choose up to 3)",
                        required: true,
                        options: [
                            "Clear view of what has been submitted",
                            "Central place for learner information",
                            "Attendance that’s always ready when needed",
                            "Better communication with QCTO / SETAs",
                            "Less admin and repetition"
                        ]
                    },
                    {
                        question_id: "q_alignment_importance",
                        type: QuestionType.RADIO,
                        text: "How important is alignment with QCTO processes?",
                        required: true,
                        options: [
                            "Very important",
                            "Important",
                            "Nice to have",
                            "Not a major concern"
                        ]
                    },
                    {
                        question_id: "q_current_status",
                        type: QuestionType.RADIO,
                        text: "Which best describes where you are right now?",
                        required: true,
                        options: [
                            "Just exploring options",
                            "Actively looking to improve",
                            "Gathering information for later",
                            "Not considering changes at the moment"
                        ]
                    }
                ]
            }
        ]
    },
    {
        slug: "trust-aware-action",
        title: "Would you like to see how this works in practice?",
        description: "There’s no obligation. Some institutions prefer to explore slowly, others want to jump in.",
        status: TemplateStatus.PUBLISHED,
        steps: [
            {
                step_id: "step_1",
                order: 1,
                title: "Next Steps",
                copy: "There’s no obligation.",
                icon: "arrow-right",
                questions: [
                    {
                        question_id: "q_next_preference",
                        type: QuestionType.RADIO,
                        text: "What would you prefer next?",
                        required: true,
                        options: [
                            "A guided walkthrough",
                            "Direct access to explore",
                            "Updates and information for now",
                            "Not interested at this stage"
                        ]
                    },
                    {
                        question_id: "q_first_look",
                        type: QuestionType.RADIO,
                        text: "What would you want to look at first?",
                        required: true,
                        options: [
                            "Submissions and requests",
                            "Attendance and evidence",
                            "Learner management",
                            "Overall compliance view"
                        ]
                    },
                    {
                        question_id: "q_not_interested_reason",
                        type: QuestionType.OTHER_REVEAL,
                        text: "That’s okay — what’s the main reason?",
                        required: false,
                        options: [
                            "Already using another system",
                            "Timing isn’t right",
                            "Not relevant to us",
                            "Other"
                        ]
                    }
                ]
            }
        ]
    }
];

async function main() {
    console.log("📝 Seeding Awareness Questionnaires...");

    for (const q of QUESTIONNAIRES) {
        await prisma.questionnaire.upsert({
            where: { slug: q.slug },
            update: {
                title: q.title,
                description: q.description,
                steps: q.steps as any,
                status: q.status,
                published_at: new Date()
            },
            create: {
                slug: q.slug,
                title: q.title,
                description: q.description,
                steps: q.steps as any,
                status: q.status,
                published_at: new Date()
            }
        });
        console.log(`✅ Upserted questionnaire: ${q.slug}`);
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

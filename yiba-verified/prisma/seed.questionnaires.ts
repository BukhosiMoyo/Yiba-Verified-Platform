
import { PrismaClient } from "@prisma/client";

export async function seedQuestionnaires(prisma: PrismaClient) {
    console.log("Seeding questionnaires...");

    const QUESTIONNAIRES = [
        {
            slug: "unaware-check-in",
            title: "Just a quick check-in — how do things currently work on your side?",
            description: "These questions help us understand your setup so we can share the right information with you.",
            steps: [
                {
                    "copy": "We work with many South African training institutions and no two are the same.",
                    "icon": "clipboard-list",
                    "order": 1,
                    "title": "Operational Context",
                    "step_id": "step_1",
                    "questions": [
                        {
                            "text": "How do you currently handle QCTO-related admin and submissions?",
                            "type": "RADIO",
                            "options": [
                                "Mostly emails, spreadsheets, and documents",
                                "A mix of manual work and some software",
                                "We use a system for most things",
                                "I’m not fully sure — it’s handled by someone else"
                            ],
                            "required": true,
                            "question_id": "q_admin_method"
                        },
                        {
                            "text": "Which of these feels closest to your experience?",
                            "type": "RADIO",
                            "options": [
                                "Submissions usually take longer than expected",
                                "Tracking what was sent and when can be tricky",
                                "Preparing for audits or visits is stressful",
                                "We manage okay, but it takes a lot of time",
                                "None of these really apply"
                            ],
                            "required": true,
                            "question_id": "q_pain_points"
                        },
                        {
                            "text": "Who usually takes responsibility for compliance and reporting?",
                            "type": "RADIO",
                            "options": [
                                "Me",
                                "A small internal team",
                                "An external consultant",
                                "It’s not clearly defined"
                            ],
                            "required": true,
                            "question_id": "q_responsibility"
                        }
                    ]
                }
            ],
            status: "PUBLISHED"
        },
        {
            slug: "problem-aware-challenges",
            title: "You’re not the only one — many institutions tell us this",
            description: "From colleges to private providers, we hear similar stories across the country. Let’s narrow down what slows things down the most for you.",
            steps: [
                {
                    "copy": "Let’s narrow down what slows things down the most for you.",
                    "icon": "alert-triangle",
                    "order": 1,
                    "title": "Challenges",
                    "step_id": "step_1",
                    "questions": [
                        {
                            "text": "What usually causes the biggest delays?",
                            "type": "CHECKBOX",
                            "options": [
                                "Finding the right documents",
                                "Verifying attendance records",
                                "Rebuilding information for submissions",
                                "Responding to short-notice requests",
                                "Internal back-and-forth between staff"
                            ],
                            "required": true,
                            "question_id": "q_delays"
                        },
                        {
                            "text": "How confident are you in your records when something is requested?",
                            "type": "RADIO",
                            "options": [
                                "Very confident",
                                "Fairly confident",
                                "Not very confident",
                                "We rely on people remembering"
                            ],
                            "required": true,
                            "question_id": "q_confidence"
                        },
                        {
                            "text": "If information was requested today, how prepared would you be?",
                            "type": "RADIO",
                            "options": [
                                "Ready immediately",
                                "Would need a few days",
                                "Would require serious preparation",
                                "Not sure"
                            ],
                            "required": true,
                            "question_id": "q_preparedness"
                        }
                    ]
                }
            ],
            status: "PUBLISHED"
        },
        {
            slug: "solution-aware-needs",
            title: "If things worked better, what would matter most to you?",
            description: "Every institution has different priorities. These questions help us focus on what would actually make a difference for you.",
            steps: [
                {
                    "copy": "Every institution has different priorities.",
                    "icon": "star",
                    "order": 1,
                    "title": "Priorities",
                    "step_id": "step_1",
                    "questions": [
                        {
                            "text": "What would help you the most right now? (Choose up to 3)",
                            "type": "CHECKBOX",
                            "options": [
                                "Clear view of what has been submitted",
                                "Central place for learner information",
                                "Attendance that’s always ready when needed",
                                "Better communication with QCTO / SETAs",
                                "Less admin and repetition"
                            ],
                            "required": true,
                            "question_id": "q_top_help"
                        },
                        {
                            "text": "How important is alignment with QCTO processes?",
                            "type": "RADIO",
                            "options": [
                                "Very important",
                                "Important",
                                "Nice to have",
                                "Not a major concern"
                            ],
                            "required": true,
                            "question_id": "q_alignment_importance"
                        },
                        {
                            "text": "Which best describes where you are right now?",
                            "type": "RADIO",
                            "options": [
                                "Just exploring options",
                                "Actively looking to improve",
                                "Gathering information for later",
                                "Not considering changes at the moment"
                            ],
                            "required": true,
                            "question_id": "q_current_status"
                        }
                    ]
                }
            ],
            status: "PUBLISHED"
        },
        {
            slug: "trust-aware-action",
            title: "Would you like to see how this works in practice?",
            description: "There’s no obligation. Some institutions prefer to explore slowly, others want to jump in.",
            steps: [
                {
                    "copy": "There’s no obligation.",
                    "icon": "arrow-right",
                    "order": 1,
                    "title": "Next Steps",
                    "step_id": "step_1",
                    "questions": [
                        {
                            "text": "What would you prefer next?",
                            "type": "RADIO",
                            "options": [
                                "A guided walkthrough",
                                "Direct access to explore",
                                "Updates and information for now",
                                "Not interested at this stage"
                            ],
                            "required": true,
                            "question_id": "q_next_preference"
                        },
                        {
                            "text": "What would you want to look at first?",
                            "type": "RADIO",
                            "options": [
                                "Submissions and requests",
                                "Attendance and evidence",
                                "Learner management",
                                "Overall compliance view"
                            ],
                            "required": true,
                            "question_id": "q_first_look"
                        },
                        {
                            "text": "That’s okay — what’s the main reason?",
                            "type": "OTHER_REVEAL",
                            "options": [
                                "Already using another system",
                                "Timing isn’t right",
                                "Not relevant to us",
                                "Other"
                            ],
                            "required": false,
                            "question_id": "q_not_interested_reason"
                        }
                    ]
                }
            ],
            status: "PUBLISHED"
        }
    ];

    let count = 0;
    for (const q of QUESTIONNAIRES) {
        await prisma.questionnaire.upsert({
            where: { slug: q.slug },
            create: {
                slug: q.slug,
                title: q.title,
                description: q.description,
                steps: q.steps as any,
                status: q.status as any,
                created_at: new Date(),
                published_at: new Date()
            },
            update: {
                title: q.title,
                description: q.description,
                steps: q.steps as any,
                status: q.status as any
            }
        });
        count++;
    }
    console.log(`✅ Seeded/Updated ${count} questionnaires.`);
}

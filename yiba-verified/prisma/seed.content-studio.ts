import { PrismaClient, EngagementState } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TEMPLATES = [
    {
        stage: EngagementState.UNCONTACTED,
        subject: "Introduction to Yiba Verified: Transforming your accreditation journey",
        body: `<p>Hi {{institution_name}},</p>
<p>We noticed that you are a key player in the {{province}} education sector, but currently handle your accreditation manually.</p>
<p>Yiba Verified is the new standard platform designed to streamline your QCTO compliance.</p>
<p>Would you be open to a 10-minute demo to see how we automate submissions?</p>`,
        ai_instructions: {
            tone: "Professional, Helpful, intriguing",
            references: ["QCTO efficiency", "Digital transformation"],
            forbidden_content: ["Aggressive sales pitch", "False urgency"]
        }
    },
    {
        stage: EngagementState.CONTACTED,
        subject: "Following up: Did you see my last note?",
        body: `<p>Hi there,</p>
<p>Just bumping this up in your inbox. We help institutions like yours save 20+ hours a month on admin.</p>
<p>Let me know if you have any questions.</p>`,
        ai_instructions: {
            tone: "Casual, short, polite",
            references: ["Time saving"],
            forbidden_content: ["Guilt tripping"]
        }
    },
    {
        stage: EngagementState.ENGAGED,
        subject: "Your invitation to Yiba Verified is waiting",
        body: `<p>Great to connect!</p>
<p>I've set up an invitation for your institution. Click the link below to review what we can do for you.</p>
<p><a href="{{cta_url}}">Review Invitation</a></p>`,
        ai_instructions: {
            tone: "Exciting, action-oriented",
            references: ["Next steps"],
            forbidden_content: []
        }
    }
];

async function main() {
    console.log("🎨 Seeding Content Studio Templates...");

    for (const t of DEFAULT_TEMPLATES) {
        await prisma.engagementStageTemplate.upsert({
            where: { stage: t.stage },
            update: {
                subject_line: t.subject,
                body_html: t.body,
                ai_instructions: t.ai_instructions,
                status: "PUBLISHED"
            },
            create: {
                stage: t.stage,
                subject_line: t.subject,
                body_html: t.body,
                ai_instructions: t.ai_instructions,
                status: "PUBLISHED",
                preview_text: t.subject, // Default
                version: 1,
                created_by: "System Seed"
            }
        });
        console.log(`✅ Upserted template for ${t.stage}`);
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

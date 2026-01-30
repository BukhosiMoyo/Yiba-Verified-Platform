/**
 * Blog Seed Script
 * Seeds initial blog categories and sample posts.
 * Run with: npx tsx prisma/seed.blog.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Initial categories for the blog
const categories = [
  {
    name: "QCTO Compliance",
    slug: "qcto-compliance",
    description: "Guides and updates on QCTO regulatory requirements and compliance best practices.",
  },
  {
    name: "Industry News",
    slug: "industry-news",
    description: "Latest news and updates from the South African education and training sector.",
  },
  {
    name: "Platform Updates",
    slug: "platform-updates",
    description: "New features, improvements, and updates to the Yiba Verified platform.",
  },
  {
    name: "Guides & Tutorials",
    slug: "guides-tutorials",
    description: "Step-by-step guides and tutorials for using Yiba Verified effectively.",
  },
  {
    name: "Best Practices",
    slug: "best-practices",
    description: "Tips and best practices for institutional readiness and quality assurance.",
  },
];

// Initial tags
const tags = [
  { name: "Readiness", slug: "readiness" },
  { name: "Documentation", slug: "documentation" },
  { name: "Form 5", slug: "form-5" },
  { name: "Institutions", slug: "institutions" },
  { name: "Learners", slug: "learners" },
  { name: "Quality Assurance", slug: "quality-assurance" },
  { name: "POPIA", slug: "popia" },
  { name: "Data Security", slug: "data-security" },
];

// Sample blog posts
const posts = [
  {
    title: "Understanding QCTO Readiness Requirements: A Complete Guide",
    slug: "understanding-qcto-readiness-requirements",
    excerpt: "A comprehensive guide to understanding what QCTO looks for when evaluating institutional readiness for programme delivery.",
    content: `
<h2 id="introduction">Introduction</h2>
<p>Navigating QCTO readiness requirements can be challenging for institutions new to the compliance landscape. This guide breaks down the key requirements and provides practical advice for achieving readiness status.</p>

<h2 id="what-is-readiness">What is Programme Delivery Readiness?</h2>
<p>Programme Delivery Readiness is the QCTO's way of ensuring that institutions have the necessary infrastructure, resources, and processes in place to deliver quality occupational qualifications. The readiness assessment covers several key areas:</p>

<ul>
<li>Physical and online infrastructure</li>
<li>Human resource capacity</li>
<li>Learning materials and curriculum alignment</li>
<li>Policies and procedures</li>
<li>Occupational health and safety compliance</li>
</ul>

<h2 id="key-documents">Key Documents You'll Need</h2>
<p>Before beginning your readiness application, ensure you have the following documents prepared:</p>

<ol>
<li><strong>Registration certificates</strong> - Company registration, DHET registration, and any professional body affiliations</li>
<li><strong>Facilitator credentials</strong> - CVs, qualifications, and contracts for all facilitators</li>
<li><strong>Facility documentation</strong> - Lease agreements or ownership proof, floor plans, and capacity information</li>
<li><strong>Policy documents</strong> - Assessment, appeals, RPL, and learner management policies</li>
<li><strong>OHS compliance</strong> - Fire certificates, first aid provisions, and safety documentation</li>
</ol>

<h2 id="common-mistakes">Common Mistakes to Avoid</h2>
<p>Based on our experience working with hundreds of institutions, here are the most common mistakes to avoid:</p>

<blockquote>
<p>"The most frequent issue we see is incomplete documentation. Institutions often submit applications with missing facilitator qualifications or expired certificates."</p>
</blockquote>

<h3>1. Incomplete Facilitator Records</h3>
<p>Ensure every facilitator has complete documentation including verified qualifications, industry experience evidence, and signed contracts.</p>

<h3>2. Outdated OHS Compliance</h3>
<p>Fire extinguisher service dates must be current. We recommend setting calendar reminders for all compliance-related expiry dates.</p>

<h3>3. Insufficient Learning Materials</h3>
<p>QCTO requires at least 50% coverage of curriculum content. Partial materials are a common reason for readiness applications being returned.</p>

<h2 id="next-steps">Next Steps</h2>
<p>Ready to start your readiness journey? Yiba Verified streamlines the entire process with guided forms, document management, and real-time status tracking. <a href="/contact">Contact us</a> to schedule a demo.</p>
    `,
    readingTime: 8,
    categorySlug: "qcto-compliance",
    tagSlugs: ["readiness", "documentation", "form-5", "institutions"],
  },
  {
    title: "5 Best Practices for Maintaining Institutional Compliance",
    slug: "best-practices-institutional-compliance",
    excerpt: "Learn the essential practices that successful institutions use to maintain their QCTO compliance status year after year.",
    content: `
<h2 id="introduction">Introduction</h2>
<p>Achieving QCTO compliance is just the beginning. Maintaining that status requires ongoing attention to documentation, processes, and continuous improvement. Here are five best practices we've observed from consistently compliant institutions.</p>

<h2 id="practice-1">1. Establish a Compliance Calendar</h2>
<p>Proactive institutions maintain a compliance calendar that tracks all important dates:</p>

<ul>
<li>Document expiry dates (facilitator contracts, certifications)</li>
<li>OHS compliance renewals (fire extinguisher servicing, first aid kit checks)</li>
<li>Policy review schedules (annual review of all institutional policies)</li>
<li>QCTO reporting deadlines</li>
</ul>

<p>Setting automated reminders 30, 60, and 90 days before expiry dates ensures nothing slips through the cracks.</p>

<h2 id="practice-2">2. Centralize Your Documentation</h2>
<p>Gone are the days of filing cabinets and scattered folders. Successful institutions use a centralized document management system that:</p>

<ul>
<li>Stores all compliance documents in one secure location</li>
<li>Maintains version history for audit trails</li>
<li>Enables quick retrieval during QCTO reviews</li>
<li>Provides backup and disaster recovery</li>
</ul>

<blockquote>
<p>Yiba Verified's Evidence Vault provides exactly this functionality, with the added benefit of integration with your readiness applications.</p>
</blockquote>

<h2 id="practice-3">3. Conduct Internal Audits</h2>
<p>Don't wait for QCTO to identify issues. Schedule quarterly internal audits to review:</p>

<ul>
<li>Facilitator qualification currency</li>
<li>Learning material updates and curriculum alignment</li>
<li>Learner records completeness</li>
<li>Policy implementation and awareness</li>
</ul>

<h2 id="practice-4">4. Train Your Team</h2>
<p>Compliance is a team effort. Ensure all staff understand:</p>

<ul>
<li>Their role in maintaining compliance</li>
<li>Documentation requirements for their function</li>
<li>How to escalate compliance concerns</li>
<li>The consequences of non-compliance</li>
</ul>

<h2 id="practice-5">5. Stay Informed</h2>
<p>QCTO requirements evolve. Stay informed by:</p>

<ul>
<li>Subscribing to QCTO communications</li>
<li>Participating in industry forums and associations</li>
<li>Following the Yiba Verified blog for updates</li>
<li>Attending compliance workshops and webinars</li>
</ul>

<h2 id="conclusion">Conclusion</h2>
<p>Maintaining compliance doesn't have to be overwhelming. By implementing these five practices, you'll build a culture of compliance that serves your institution and your learners well.</p>
    `,
    readingTime: 6,
    categorySlug: "best-practices",
    tagSlugs: ["quality-assurance", "institutions", "documentation"],
  },
  {
    title: "Introducing Yiba Verified: Transforming QCTO Compliance",
    slug: "introducing-yiba-verified",
    excerpt: "We're excited to announce the launch of Yiba Verified, a comprehensive platform designed to simplify QCTO compliance for South African educational institutions.",
    content: `
<h2 id="welcome">Welcome to Yiba Verified</h2>
<p>Today marks an exciting milestone as we officially launch Yiba Verified – a comprehensive platform built from the ground up to transform how South African institutions manage QCTO compliance.</p>

<h2 id="the-problem">The Problem We're Solving</h2>
<p>For too long, institutional readiness and compliance management has been characterized by:</p>

<ul>
<li>Paper-based documentation that's difficult to track and manage</li>
<li>Fragmented communication between institutions and QCTO</li>
<li>Lack of visibility into compliance status and requirements</li>
<li>Inefficient review processes that delay approvals</li>
<li>No centralized system for learner tracking and evidence management</li>
</ul>

<p>We built Yiba Verified to address each of these challenges.</p>

<h2 id="what-we-offer">What Yiba Verified Offers</h2>

<h3>For Institutions</h3>
<ul>
<li><strong>Guided Readiness Applications</strong> - Step-by-step forms that ensure complete submissions</li>
<li><strong>Evidence Vault</strong> - Secure document storage with version control</li>
<li><strong>Learner Management</strong> - Complete learner profiles and progress tracking</li>
<li><strong>Real-time Status</strong> - Always know where your applications stand</li>
</ul>

<h3>For QCTO</h3>
<ul>
<li><strong>Streamlined Reviews</strong> - All documentation in one place for efficient evaluation</li>
<li><strong>Audit Trails</strong> - Complete transparency and accountability</li>
<li><strong>Dashboard Insights</strong> - Overview of compliance status across institutions</li>
<li><strong>Secure Access</strong> - Role-based permissions for team collaboration</li>
</ul>

<h3>For Learners</h3>
<ul>
<li><strong>Profile Management</strong> - Maintain accurate personal and academic records</li>
<li><strong>Progress Tracking</strong> - Visibility into learning journey milestones</li>
<li><strong>Verified Credentials</strong> - Trustworthy verification of qualifications</li>
</ul>

<h2 id="our-commitment">Our Commitment</h2>
<p>We're committed to:</p>

<ul>
<li><strong>Security First</strong> - Enterprise-grade security and POPIA compliance</li>
<li><strong>Continuous Improvement</strong> - Regular updates based on user feedback</li>
<li><strong>Support Excellence</strong> - Dedicated support for all platform users</li>
<li><strong>Partnership</strong> - Working closely with QCTO and institutions to evolve the platform</li>
</ul>

<h2 id="get-started">Get Started</h2>
<p>Ready to transform your compliance processes? <a href="/contact">Request a demo</a> and see how Yiba Verified can work for your institution.</p>

<p>Welcome to the future of QCTO compliance.</p>
    `,
    readingTime: 5,
    categorySlug: "platform-updates",
    tagSlugs: ["institutions", "learners", "quality-assurance"],
  },
];

async function main() {
  console.log("🌱 Starting blog seed...\n");

  // Find an admin user to be the author
  const author = await prisma.user.findFirst({
    where: {
      role: { in: ["PLATFORM_ADMIN", "QCTO_ADMIN", "QCTO_SUPER_ADMIN"] },
    },
  });

  if (!author) {
    console.error("❌ No admin user found to set as author. Please create an admin user first.");
    process.exit(1);
  }

  console.log(`📝 Using author: ${author.first_name} ${author.last_name} (${author.email})\n`);

  // Seed categories
  console.log("📁 Creating categories...");
  for (const category of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
    console.log(`   ✓ ${category.name}`);
  }

  // Seed tags
  console.log("\n🏷️  Creating tags...");
  for (const tag of tags) {
    await prisma.blogTag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
    console.log(`   ✓ ${tag.name}`);
  }

  // Seed posts
  console.log("\n📰 Creating blog posts...");
  for (const post of posts) {
    // Get category
    const category = await prisma.blogCategory.findUnique({
      where: { slug: post.categorySlug },
    });

    // Get tags
    const tagRecords = await prisma.blogTag.findMany({
      where: { slug: { in: post.tagSlugs } },
    });

    // Create or update post
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
    });

    if (existingPost) {
      await prisma.blogPost.update({
        where: { slug: post.slug },
        data: {
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          readingTime: post.readingTime,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
      console.log(`   ↻ Updated: ${post.title}`);
    } else {
      await prisma.blogPost.create({
        data: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          readingTime: post.readingTime,
          status: "PUBLISHED",
          publishedAt: new Date(),
          authorId: author.user_id,
          categories: category
            ? {
                create: { categoryId: category.id },
              }
            : undefined,
          tags: {
            create: tagRecords.map((tag) => ({ tagId: tag.id })),
          },
        },
      });
      console.log(`   ✓ Created: ${post.title}`);
    }
  }

  console.log("\n✅ Blog seed completed successfully!");
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${tags.length} tags`);
  console.log(`   - ${posts.length} posts`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding blog:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

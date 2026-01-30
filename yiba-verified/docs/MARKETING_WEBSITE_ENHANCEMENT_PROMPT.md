# Marketing Website Enhancement Implementation Prompt

> **Purpose**: Progressive enhancement of the Yiba Verified marketing website
> **Approach**: Enhance existing pages, don't replace them
> **Style Guide**: Stripe/Linear-inspired, government-ready, professional

---

## Pre-Implementation Checklist

Before making any changes, verify:
- [ ] Existing pages still render correctly
- [ ] Dark mode works on all pages
- [ ] No linter errors in marketing components
- [ ] Git branch is clean or changes are committed

---

## Phase 1: Global Fixes

### 1.1 Email Address Update

**Files to update:**
- `src/components/marketing/MarketingFooter.tsx` - Line 51-52
- `src/app/contact/page.tsx` - Lines 60, 81, 97-100
- `src/app/account-deactivated/page.tsx` - Line 27

**Change:**
```
FROM: info@yibaverified.com
TO: hello@yibaverified.co.za
```

Also update support emails where appropriate:
```
FROM: support@yibaverified.com  
TO: support@yibaverified.co.za
```

### 1.2 Mobile Navigation

**File:** `src/components/marketing/MarketingNav.tsx`

**Current issue:** Navigation links are hidden on mobile with no hamburger menu.

**Implementation:**
1. Add state for mobile menu open/closed
2. Add hamburger button visible on `md:hidden`
3. Add slide-out or dropdown menu with navigation links
4. Include proper animations (250ms slide or fade)
5. Add focus trap and click-outside-to-close
6. Maintain theme toggle in mobile menu

**Pattern to follow:**
```tsx
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// Hamburger button
<button 
  className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  aria-label="Toggle menu"
>
  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
</button>

// Mobile menu overlay
{mobileMenuOpen && (
  <div className="fixed inset-0 top-[60px] z-40 bg-background/95 backdrop-blur-sm md:hidden">
    <nav className="flex flex-col p-6 gap-4">
      {/* Navigation links with larger touch targets */}
    </nav>
  </div>
)}
```

### 1.3 Footer Placeholder Links

**File:** `src/components/marketing/MarketingFooter.tsx`

**Create new pages:**
- `/privacy-policy/page.tsx` - Privacy Policy page
- `/terms/page.tsx` - Terms of Service page

**Update footer links from `#` to actual routes.**

**Content for these pages:** Keep minimal initially with placeholder sections:
- Effective date
- Key sections (Data Collection, Usage, Rights, Contact)
- Professional formatting with proper headings

---

## Phase 2: Page Enhancements

### 2.1 Home Page Enhancement

**File:** `src/app/page.tsx`

**Keep existing sections:**
- Hero section (enhance, don't replace)
- Proof/metrics strip
- Feature grid (3 cards)
- Security/trust section
- Final CTA

**Add new sections:**

#### A. Testimonials Section (after feature grid)
```tsx
<section className="py-20 sm:py-24">
  <div className="container max-w-6xl mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-12">
      Trusted by Institutions Across South Africa
    </h2>
    <div className="grid md:grid-cols-3 gap-8">
      {/* TestimonialCard components */}
    </div>
  </div>
</section>
```

**Note:** Use placeholder testimonials initially:
- Institution 1: Focus on compliance benefits
- Institution 2: Focus on time savings
- QCTO perspective: Focus on transparency

#### B. Stats/Metrics Section (after hero or proof strip)
```tsx
<section className="py-16 border-y border-border">
  <div className="container max-w-6xl mx-auto px-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      <div>
        <div className="text-4xl font-bold text-primary">X+</div>
        <div className="text-muted-foreground">Institutions</div>
      </div>
      {/* More stats */}
    </div>
  </div>
</section>
```

**Metrics to display (use placeholders, update when real data available):**
- Institutions onboarded
- Learners verified
- Readiness reviews processed
- Uptime percentage

#### C. Visual Flow Enhancement
- Add subtle connecting elements between sections
- Use gradient transitions between sections
- Consider adding subtle scroll animations (optional, don't overdo)

### 2.2 How It Works Enhancement

**File:** `src/app/how-it-works/page.tsx`

**Current:** 4 numbered step cards

**Enhancements:**

#### A. Add Icons to Each Step
```tsx
import { Building2, FileCheck, Search, BarChart3 } from 'lucide-react';

const steps = [
  { icon: Building2, title: 'Institution Setup', ... },
  { icon: FileCheck, title: 'Readiness Documentation', ... },
  { icon: Search, title: 'QCTO Review', ... },
  { icon: BarChart3, title: 'Ongoing Management', ... },
];
```

#### B. Add Visual Timeline
- Connect steps with a vertical or horizontal line
- Use gradient or dashed line
- Animate on scroll (optional)

```tsx
<div className="relative">
  {/* Timeline line */}
  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary to-primary/20 hidden md:block" />
  
  {/* Steps with alternating layout */}
  {steps.map((step, i) => (
    <div key={i} className={`flex ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 mb-16`}>
      {/* Step card */}
    </div>
  ))}
</div>
```

#### C. Add User-Specific Tabs
```tsx
<Tabs defaultValue="institutions" className="w-full">
  <TabsList className="grid w-full grid-cols-3 mb-8">
    <TabsTrigger value="institutions">For Institutions</TabsTrigger>
    <TabsTrigger value="qcto">For QCTO</TabsTrigger>
    <TabsTrigger value="students">For Students</TabsTrigger>
  </TabsList>
  <TabsContent value="institutions">
    {/* Institution-specific flow */}
  </TabsContent>
  {/* Other tabs */}
</Tabs>
```

### 2.3 Contact Page Enhancement

**File:** `src/app/contact/page.tsx`

**Current:** Mailto links only

**Create a real contact form:**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    organization: '',
    purpose: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Implement form submission
    // Options: Email API (Resend), form service (Formspree), or custom endpoint
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
        <p className="text-muted-foreground">We'll be in touch within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input placeholder="Your name" required value={formState.name} onChange={...} />
        <Input type="email" placeholder="Email address" required value={formState.email} onChange={...} />
      </div>
      <Input placeholder="Organization (optional)" value={formState.organization} onChange={...} />
      <Select value={formState.purpose} onValueChange={...}>
        <SelectTrigger>
          <SelectValue placeholder="What can we help with?" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="demo">Request a Demo</SelectItem>
          <SelectItem value="sales">Sales Inquiry</SelectItem>
          <SelectItem value="support">Support</SelectItem>
          <SelectItem value="partnership">Partnership</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      <Textarea placeholder="Your message" rows={5} required value={formState.message} onChange={...} />
      <Button type="submit" className="w-full btn-primary-premium" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
```

**API Route (optional):** `src/app/api/contact/route.ts`
- Validate input
- Send email via Resend or similar
- Return success/error response

### 2.4 Security Page Enhancement

**File:** `src/app/security/page.tsx`

**Add trust badges section:**

```tsx
<section className="py-16 bg-muted/30 rounded-2xl">
  <h3 className="text-xl font-semibold text-center mb-8">Compliance & Certifications</h3>
  <div className="flex flex-wrap justify-center gap-8 items-center">
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Shield className="h-8 w-8 text-primary" />
      </div>
      <span className="text-sm font-medium">POPIA Compliant</span>
    </div>
    {/* More badges: QCTO Aligned, Data Encrypted, etc. */}
  </div>
</section>
```

### 2.5 Create About Page

**Create new file:** `src/app/about/page.tsx`

**Sections:**
1. Hero with mission statement
2. Our Story (brief narrative)
3. Our Values (3-4 core values with icons)
4. Team (placeholder for future team photos/bios)
5. Partners/Affiliations (if any)
6. CTA section

**Metadata:**
```tsx
export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Yiba Verified, our mission to transform QCTO compliance and oversight in South Africa.',
  openGraph: {
    title: 'About Yiba Verified',
    description: 'Learn about Yiba Verified, our mission to transform QCTO compliance and oversight in South Africa.',
  },
};
```

**Update footer:** Change About link from `/` to `/about`

---

## Phase 3: Blog Implementation

### 3.1 Database Schema

**Update:** `prisma/schema.prisma`

```prisma
// Add to existing schema

model BlogPost {
  id              String       @id @default(cuid())
  title           String
  slug            String       @unique
  excerpt         String       @db.Text
  content         String       @db.Text
  
  // Images
  featuredImage   String?
  featuredImageAlt String?
  
  // SEO
  metaTitle       String?
  metaDescription String?      @db.Text
  
  // Status
  status          BlogStatus   @default(DRAFT)
  publishedAt     DateTime?
  
  // Metadata
  readingTime     Int?
  
  // Relationships
  authorId        String
  author          User         @relation("BlogAuthor", fields: [authorId], references: [id])
  categories      BlogPostCategory[]
  tags            BlogPostTag[]
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([slug])
  @@index([status, publishedAt])
}

enum BlogStatus {
  DRAFT
  PUBLISHED
}

model BlogCategory {
  id          String             @id @default(cuid())
  name        String
  slug        String             @unique
  description String?            @db.Text
  posts       BlogPostCategory[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model BlogTag {
  id    String          @id @default(cuid())
  name  String
  slug  String          @unique
  posts BlogPostTag[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Junction tables
model BlogPostCategory {
  postId     String
  categoryId String
  post       BlogPost     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   BlogCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@id([postId, categoryId])
}

model BlogPostTag {
  postId String
  tagId  String
  post   BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    BlogTag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([postId, tagId])
}
```

**Update User model:**
```prisma
model User {
  // ... existing fields
  
  blogPosts BlogPost[] @relation("BlogAuthor")
}
```

**Run migration:**
```bash
npx prisma migrate dev --name add_blog_models
```

### 3.2 Blog Components

**Create directory:** `src/components/blog/`

#### BlogCard.tsx
```tsx
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    featuredImage?: string | null;
    publishedAt: Date | null;
    readingTime?: number | null;
    categories: { category: { name: string; slug: string } }[];
  };
  featured?: boolean;
}

export function BlogCard({ post, featured }: BlogCardProps) {
  return (
    <Link 
      href={`/blog/${post.slug}`}
      className={`group block bg-card border border-border rounded-xl overflow-hidden hover:shadow-float transition-all duration-200 ${
        featured ? 'md:col-span-2 md:grid md:grid-cols-2' : ''
      }`}
    >
      {post.featuredImage && (
        <div className={`relative ${featured ? 'h-64 md:h-full' : 'h-48'} overflow-hidden`}>
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex gap-2 mb-3">
          {post.categories.slice(0, 2).map(({ category }) => (
            <Badge key={category.slug} variant="secondary">
              {category.name}
            </Badge>
          ))}
        </div>
        <h3 className={`font-semibold mb-2 group-hover:text-primary transition-colors ${
          featured ? 'text-2xl' : 'text-lg'
        }`}>
          {post.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {post.publishedAt && (
            <span>{formatDate(post.publishedAt)}</span>
          )}
          {post.readingTime && (
            <span>{post.readingTime} min read</span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

#### BlogContent.tsx
```tsx
'use client';

import { useMemo } from 'react';
import Image from 'next/image';

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  // Render markdown/rich text content
  // Consider using @tailwindcss/typography for prose styling
  // Or a markdown parser like react-markdown
  
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      {/* Render content - implement based on content format */}
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
```

#### BlogTableOfContents.tsx
```tsx
'use client';

import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function BlogTableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from article
    const article = document.querySelector('article');
    if (!article) return;
    
    const elements = article.querySelectorAll('h2, h3');
    const items: Heading[] = Array.from(elements).map((el) => ({
      id: el.id,
      text: el.textContent || '',
      level: parseInt(el.tagName[1]),
    }));
    
    setHeadings(items);
  }, []);

  useEffect(() => {
    // Intersection observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -80% 0%' }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24 space-y-2">
      <h4 className="font-semibold mb-4">On this page</h4>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className={`block text-sm transition-colors ${
            heading.level === 3 ? 'pl-4' : ''
          } ${
            activeId === heading.id 
              ? 'text-primary font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}
```

#### BlogAuthor.tsx
```tsx
interface BlogAuthorProps {
  author: {
    name: string;
    image?: string | null;
  };
}

export function BlogAuthor({ author }: BlogAuthorProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
        {author.image ? (
          <img src={author.image} alt={author.name} className="rounded-full" />
        ) : (
          author.name.charAt(0)
        )}
      </div>
      <div>
        <div className="font-medium">{author.name}</div>
        <div className="text-sm text-muted-foreground">Author</div>
      </div>
    </div>
  );
}
```

### 3.3 Blog Pages

#### Blog Landing: `src/app/blog/page.tsx`

```tsx
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { BlogCard } from '@/components/blog/BlogCard';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Insights, guides, and news about QCTO compliance, institutional readiness, and education technology in South Africa.',
  openGraph: {
    title: 'Yiba Verified Blog',
    description: 'Insights, guides, and news about QCTO compliance, institutional readiness, and education technology.',
  },
};

export default async function BlogPage() {
  const [featuredPost, latestPosts, categories] = await Promise.all([
    prisma.blogPost.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      include: {
        categories: { include: { category: true } },
        author: { select: { name: true } },
      },
    }),
    prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      skip: 1,
      take: 6,
      include: {
        categories: { include: { category: true } },
      },
    }),
    prisma.blogCategory.findMany({
      include: {
        _count: { select: { posts: true } },
      },
    }),
  ]);

  return (
    <>
      <MarketingNav />
      <main className="min-h-screen pt-20">
        <div className="container max-w-6xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Blog</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Insights, guides, and news about QCTO compliance and education technology
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((cat) => (
              <a
                key={cat.slug}
                href={`/blog/category/${cat.slug}`}
                className="px-4 py-2 rounded-full bg-muted hover:bg-accent transition-colors text-sm"
              >
                {cat.name} ({cat._count.posts})
              </a>
            ))}
          </div>

          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-16">
              <BlogCard post={featuredPost} featured />
            </div>
          )}

          {/* Latest Posts */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
```

#### Blog Post: `src/app/blog/[slug]/page.tsx`

```tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { BlogContent } from '@/components/blog/BlogContent';
import { BlogTableOfContents } from '@/components/blog/BlogTableOfContents';
import { BlogAuthor } from '@/components/blog/BlogAuthor';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
  });

  if (!post) return {};

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: {
      author: { select: { name: true, image: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!post) notFound();

  return (
    <>
      <MarketingNav />
      <main className="min-h-screen pt-20">
        <article className="container max-w-4xl mx-auto px-4 py-16">
          {/* Back link */}
          <Link 
            href="/blog" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="flex gap-2 mb-4">
              {post.categories.map(({ category }) => (
                <Badge key={category.slug} variant="secondary">
                  {category.name}
                </Badge>
              ))}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              {post.publishedAt && (
                <span>{formatDate(post.publishedAt)}</span>
              )}
              {post.readingTime && (
                <span>{post.readingTime} min read</span>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative aspect-video mb-12 rounded-xl overflow-hidden">
              <img
                src={post.featuredImage}
                alt={post.featuredImageAlt || post.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Content with TOC */}
          <div className="grid lg:grid-cols-[1fr_250px] gap-12">
            <BlogContent content={post.content} />
            <aside className="hidden lg:block">
              <BlogTableOfContents />
            </aside>
          </div>

          {/* Author */}
          <div className="mt-12 pt-12 border-t border-border">
            <BlogAuthor author={post.author} />
          </div>
        </article>
      </main>
      <MarketingFooter />
    </>
  );
}
```

#### Category Page: `src/app/blog/category/[slug]/page.tsx`

```tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BlogCard } from '@/components/blog/BlogCard';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await prisma.blogCategory.findUnique({
    where: { slug: params.slug },
  });

  if (!category) return {};

  return {
    title: `${category.name} - Blog`,
    description: category.description || `Articles about ${category.name}`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await prisma.blogCategory.findUnique({
    where: { slug: params.slug },
    include: {
      posts: {
        where: { post: { status: 'PUBLISHED' } },
        include: {
          post: {
            include: {
              categories: { include: { category: true } },
            },
          },
        },
        orderBy: { post: { publishedAt: 'desc' } },
      },
    },
  });

  if (!category) notFound();

  return (
    <>
      <MarketingNav />
      <main className="min-h-screen pt-20">
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
            {category.description && (
              <p className="text-xl text-muted-foreground">{category.description}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {category.posts.map(({ post }) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
```

### 3.4 Blog Admin (Minimal)

For initial launch, consider using:
1. **Prisma Studio** for content management (`npx prisma studio`)
2. **Direct database seeding** for initial posts
3. **Future enhancement:** Build admin UI under `/platform-admin/blog/`

---

## Phase 4: SEO Optimizations

### 4.1 Update Sitemap

**File:** `src/app/sitemap.ts`

```tsx
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yibaverified.co.za';

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 1 },
    { url: `${baseUrl}/features`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/security`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  // Blog posts
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
  });

  const blogPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Blog categories
  const categories = await prisma.blogCategory.findMany({
    select: { slug: true },
  });

  const categoryPages = categories.map((cat) => ({
    url: `${baseUrl}/blog/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...categoryPages];
}
```

### 4.2 Add Structured Data

For blog posts, add JSON-LD in the head:

```tsx
// In blog/[slug]/page.tsx

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.excerpt,
  image: post.featuredImage,
  datePublished: post.publishedAt?.toISOString(),
  dateModified: post.updatedAt.toISOString(),
  author: {
    '@type': 'Person',
    name: post.author.name,
  },
  publisher: {
    '@type': 'Organization',
    name: 'Yiba Verified',
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/Yiba%20Verified%20Icon.webp`,
    },
  },
};

// Add to head
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

---

## Styling Guidelines

Follow the existing design system:

### Colors (Use Design Tokens)
```tsx
// ✅ Good
className="bg-background text-foreground border-border"
className="bg-primary text-primary-foreground"
className="text-muted-foreground"

// ❌ Bad
className="bg-white text-gray-900"
```

### Buttons
```tsx
// Primary CTA
className="btn-primary-premium px-6 py-3 rounded-xl"

// Secondary
className="border border-border bg-background hover:bg-accent px-6 py-3 rounded-xl transition-colors"
```

### Cards
```tsx
className="bg-card border border-border rounded-xl p-6 hover:shadow-float transition-shadow"
```

### Transitions
- Always add `transition-colors` or `transition-all`
- Use `duration-200` (200ms max for UI)
- Hover effects: `hover:shadow-float hover:-translate-y-0.5`

### Responsive
- Mobile-first: start with mobile styles, add `sm:`, `md:`, `lg:` for larger
- Spacing: `py-16 sm:py-20 md:py-24`
- Typography: `text-3xl sm:text-4xl md:text-5xl`
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

## Testing Checklist

After each phase, verify:
- [ ] Page renders correctly
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Links work correctly
- [ ] Forms validate properly
- [ ] SEO metadata present
- [ ] Accessibility (focus states, contrast)

---

## Notes

- **Do not delete** existing working code unless replacing with enhanced version
- **Commit after each phase** to enable easy rollback
- **Test on multiple devices** (phone, tablet, desktop)
- **Run linter** after changes: `npm run lint`
- **Check dark mode** after styling changes

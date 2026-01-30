import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BlogCard } from "@/components/blog/BlogCard";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { GradientShell } from "@/components/shared/Backgrounds";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights, guides, and news about QCTO compliance, institutional readiness, and education technology in South Africa.",
  openGraph: {
    title: "Yiba Verified Blog",
    description:
      "Insights, guides, and news about QCTO compliance, institutional readiness, and education technology.",
    type: "website",
  },
};

export const revalidate = 3600; // Revalidate every hour

async function getBlogData() {
  const [featuredPost, latestPosts, categories] = await Promise.all([
    // Featured post (most recent published)
    prisma.blogPost.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: {
        categories: { include: { category: true } },
        author: { select: { first_name: true, last_name: true } },
      },
    }),
    // Latest posts (skip featured)
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      skip: 1,
      take: 9,
      include: {
        categories: { include: { category: true } },
      },
    }),
    // Categories with post counts
    prisma.blogCategory.findMany({
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return { featuredPost, latestPosts, categories };
}

export default async function BlogPage() {
  const { featuredPost, latestPosts, categories } = await getBlogData();

  const hasNoPosts = !featuredPost && latestPosts.length === 0;

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Hero */}
        <GradientShell as="section" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge
                variant="secondary"
                className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium border-border/60"
              >
                Insights & Updates
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Blog
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Insights, guides, and news about QCTO compliance and education
                technology in South Africa.
              </p>
            </div>
          </div>
        </GradientShell>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-8 border-b border-border/60 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap gap-2 justify-center">
                <Link
                  href="/blog"
                  className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-colors"
                >
                  All Posts
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/blog/category/${cat.slug}`}
                    className="px-4 py-2 rounded-full bg-background border border-border hover:bg-accent transition-colors text-sm"
                  >
                    {cat.name}
                    {cat._count.posts > 0 && (
                      <span className="ml-1.5 text-muted-foreground">
                        ({cat._count.posts})
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {hasNoPosts ? (
              // Empty state
              <div className="text-center py-20">
                <div className="flex justify-center mb-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Coming Soon
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  We&apos;re working on great content for you. Check back soon for
                  insights on QCTO compliance and education technology.
                </p>
              </div>
            ) : (
              <>
                {/* Featured Post */}
                {featuredPost && (
                  <div className="mb-20">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
                      Featured Article
                    </h2>
                    <BlogCard post={featuredPost} featured />
                  </div>
                )}

                {/* Latest Posts */}
                {latestPosts.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
                      Latest Posts
                    </h2>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      {latestPosts.map((post) => (
                        <BlogCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

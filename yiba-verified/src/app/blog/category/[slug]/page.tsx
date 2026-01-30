import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BlogCard } from "@/components/blog/BlogCard";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ChevronLeft, FileText } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCategory(slug: string) {
  return prisma.blogCategory.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { post: { status: "PUBLISHED" } },
        include: {
          post: {
            include: {
              categories: { include: { category: true } },
            },
          },
        },
        orderBy: { post: { publishedAt: "desc" } },
      },
      _count: { select: { posts: true } },
    },
  });
}

async function getAllCategories() {
  return prisma.blogCategory.findMany({
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.blogCategory.findUnique({
    where: { slug },
  });

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} - Blog`,
    description:
      category.description ||
      `Articles and insights about ${category.name} from Yiba Verified.`,
    openGraph: {
      title: `${category.name} - Yiba Verified Blog`,
      description:
        category.description ||
        `Articles and insights about ${category.name}.`,
      type: "website",
    },
  };
}

export async function generateStaticParams() {
  const categories = await prisma.blogCategory.findMany({
    select: { slug: true },
  });

  return categories.map((cat) => ({
    slug: cat.slug,
  }));
}

export const revalidate = 3600; // Revalidate every hour

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [category, allCategories] = await Promise.all([
    getCategory(slug),
    getAllCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const posts = category.posts.map((p) => p.post);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        {/* Header */}
        <section className="py-16 sm:py-24 bg-muted/30 border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <div className="mb-8">
              <Link
                href="/blog"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                All Posts
              </Link>
            </div>

            <div className="max-w-2xl">
              <Badge
                variant="secondary"
                className="mb-4 rounded-full px-4 py-1.5 text-xs font-medium"
              >
                Category
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-4 text-lg text-muted-foreground">
                  {category.description}
                </p>
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                {posts.length} {posts.length === 1 ? "article" : "articles"}
              </p>
            </div>
          </div>
        </section>

        {/* Categories nav */}
        <section className="py-6 border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/blog"
                className="px-4 py-2 rounded-full bg-background border border-border hover:bg-accent transition-colors text-sm"
              >
                All Posts
              </Link>
              {allCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/blog/category/${cat.slug}`}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    cat.slug === slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border hover:bg-accent"
                  }`}
                >
                  {cat.name}
                  {cat._count.posts > 0 && (
                    <span
                      className={`ml-1.5 ${
                        cat.slug === slug
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      ({cat._count.posts})
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Posts */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {posts.length === 0 ? (
              // Empty state
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  No posts yet
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  We haven&apos;t published any articles in this category yet.
                  Check back soon!
                </p>
                <Link
                  href="/blog"
                  className="text-primary hover:underline font-medium"
                >
                  View all posts →
                </Link>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

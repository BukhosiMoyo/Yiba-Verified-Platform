import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";

  // Static marketing routes
  const staticRoutes = [
    { route: "", priority: 1.0, changeFrequency: "monthly" as const },
    { route: "/features", priority: 0.8, changeFrequency: "monthly" as const },
    { route: "/how-it-works", priority: 0.8, changeFrequency: "monthly" as const },
    { route: "/security", priority: 0.8, changeFrequency: "monthly" as const },
    { route: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
    { route: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
    { route: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { route: "/institutions", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/blog", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" as const },
    { route: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const staticPages = staticRoutes.map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // Dynamic blog posts
  let blogPostPages: MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];

  try {
    const [posts, categories] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogCategory.findMany({
        select: { slug: true, updatedAt: true },
      }),
    ]);

    blogPostPages = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    categoryPages = categories.map((cat) => ({
      url: `${baseUrl}/blog/category/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // If database is not available (e.g., build time without DB), 
    // just return static pages
    console.warn("Could not fetch blog data for sitemap");
  }

  // Public institution profiles (is_public only)
  let institutionPages: MetadataRoute.Sitemap = [];
  try {
    const publicProfiles = await prisma.institutionPublicProfile.findMany({
      where: { is_public: true, institution: { deleted_at: null } },
      select: { slug: true, updated_at: true },
    });
    institutionPages = publicProfiles.map((p) => ({
      url: `${baseUrl}/institutions/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    console.warn("Could not fetch institution profiles for sitemap");
  }

  return [...staticPages, ...blogPostPages, ...categoryPages, ...institutionPages];
}

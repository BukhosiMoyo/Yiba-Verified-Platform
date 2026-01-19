import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.com";

  // Marketing routes only (indexed)
  const marketingRoutes = [
    "",
    "/features",
    "/how-it-works",
    "/security",
    "/pricing",
    "/contact",
  ];

  return marketingRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));
}

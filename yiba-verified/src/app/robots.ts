import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/platform-admin/",
          "/qcto/",
          "/institution/",
          "/student/",
          "/api/",
          "/login",
          "/logout",
          "/signup",
          "/invite",
          "/unauthorized",
          "/check-email",
          "/reset-success",
          "/account-deactivated",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

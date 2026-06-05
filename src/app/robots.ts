import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/painel", "/minha-conta", "/api/"],
    },
    sitemap: `${(process.env.NEXTAUTH_URL ?? "https://belabelo.cv").replace(/\/$/, "")}/sitemap.xml`,
  };
}

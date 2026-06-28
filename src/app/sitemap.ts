import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = (process.env.NEXTAUTH_URL ?? "https://belabelo.cv").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const venues = await prisma.venue.findMany({
    where: {
      status: "approved",
    },
    select: { slug: true, updatedAt: true },
  });

  const venueUrls: MetadataRoute.Sitemap = venues.map((v) => ({
    url: `${SITE_URL}/estabelecimentos/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/estabelecimentos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/parceiros`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/termos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...venueUrls,
  ];
}

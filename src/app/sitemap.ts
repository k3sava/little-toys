import type { MetadataRoute } from "next";

// Toys hub is single-page. The toys themselves live on their own domains.
// We index just the hub here; each toy is responsible for its own AEO.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: "https://toys.iamkesava.com/",
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
  ];
}

import type { MetadataRoute } from "next";

const aiAgents = [
  "GPTBot",
  "Google-Extended",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "CCBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...aiAgents.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: "https://toys.iamkesava.com/sitemap.xml",
    host: "https://toys.iamkesava.com",
  };
}

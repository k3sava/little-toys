import type { MetadataRoute } from "next";

const aiAgents = [
  "Googlebot",
  "Bingbot",
  "Applebot",
  "Claude-SearchBot",
  "Claude-User",
  "ChatGPT-User",
  "OAI-SearchBot",
  "Perplexity-User",
  "PerplexityBot",
  "DuckAssistBot",
  "MistralAI-User",
  "Google-CloudVertexBot",
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "anthropic-ai",
  "CCBot",
  "Amazonbot",
  "Bytespider",
  "FacebookBot",
  "meta-externalagent",
  "PetalBot",
  "archive.org_bot",
  "ia_archiver",
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

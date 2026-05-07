#!/usr/bin/env node
// prebuild-aeo.mjs — generate AEO surface from src/data/toys.ts before next build.
// Outputs to public/:
//   llms.txt
//   .well-known/agent-permissions.json
//   og/default.svg

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const PUB = join(ROOT, "public");
const TOYS_FILE = join(ROOT, "src", "data", "toys.ts");
const SITE = "https://toys.iamkesava.com";

async function parseToys() {
  const src = await readFile(TOYS_FILE, "utf8");
  const groupsMatch = src.match(/export const groups[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (!groupsMatch) throw new Error("could not locate groups array");
  const body = groupsMatch[1];
  // Each group has a label + apps array. Extract apps inline; we don't need
  // group structure for llms.txt directly (we build sections from labels).
  const groupBlocks = body.split(/^\s*\{\s*$/m).slice(1);
  const groups = [];
  for (const block of body.split(/\n\s*\{\s*\n/).slice(1)) {
    const labelM = block.match(/label:\s*"([^"]+)"/);
    if (!labelM) continue;
    const appsM = block.match(/apps:\s*\[([\s\S]*?)\n\s{4}\],?/);
    if (!appsM) continue;
    const apps = [];
    const re = /\{\s*title:\s*"([^"]+)"\s*,\s*badge:\s*"([^"]+)"\s*,\s*description:\s*"([^"]+)"\s*,\s*href:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(appsM[1])) !== null) {
      apps.push({ title: m[1], badge: m[2], description: m[3], href: m[4] });
    }
    groups.push({ label: labelM[1], apps });
  }
  return groups;
}

async function writeLlms(groups) {
  const all = groups.flatMap((g) => g.apps);
  const lines = [
    "# little toys",
    "",
    "> Creative experiments by Kesava. Interactive audio toys, generative visuals, physics simulations, CSS art. All free, all in your browser.",
    "",
    `Counts: ${all.length} toys across ${groups.length} categories.`,
    "",
    "## Index",
    "",
    `- [Hub](${SITE}/): all toys grouped by category.`,
    `- [Sitemap](${SITE}/sitemap.xml)`,
    "",
    "## Categories",
    "",
  ];
  for (const g of groups) {
    lines.push(`### ${g.label}`);
    lines.push("");
    for (const t of g.apps) {
      lines.push(`- [${t.title}](${t.href}): ${t.description}`);
    }
    lines.push("");
  }
  lines.push("## License");
  lines.push("");
  lines.push("MIT. Cite freely with attribution to Kesava.");
  await writeFile(join(PUB, "llms.txt"), lines.join("\n"));
}

async function writeAgentPermissions(groups) {
  const all = groups.flatMap((g) => g.apps);
  await mkdir(join(PUB, ".well-known"), { recursive: true });
  const obj = {
    $schema: "https://addyosmani.com/agent-permissions/schema.json",
    policy_version: "1.0",
    site: SITE,
    license: "MIT",
    attribution_required: true,
    allowed_uses: ["read", "summarize", "cite", "answer-engine-indexing", "training-with-attribution"],
    disallowed_uses: ["republish-without-attribution"],
    preferred_format: "html",
    canonical_index: `${SITE}/sitemap.xml`,
    discovery: [`${SITE}/llms.txt`, `${SITE}/sitemap.xml`, `${SITE}/robots.txt`],
    counts: { toys: all.length, categories: groups.length },
    last_updated: new Date().toISOString().slice(0, 10),
  };
  await writeFile(join(PUB, ".well-known", "agent-permissions.json"), JSON.stringify(obj, null, 2));
}

const W = 1200, H = 630;
function escapeXml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
}
function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f0f1e"/>
      <stop offset="1" stop-color="#1a1530"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.3" cy="0.4" r="0.6">
      <stop offset="0" stop-color="#c084fc" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#c084fc" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g transform="translate(80, 60)">
    <circle cx="0" cy="14" r="6" fill="#c084fc"/>
    <text x="16" y="20" font-family="DM Sans, system-ui, sans-serif" font-size="22" fill="#fafafa">little toys</text>
  </g>
  <text x="80" y="180" font-family="JetBrains Mono, monospace" font-size="16" fill="#a78bfa" letter-spacing="2">CREATIVE EXPERIMENTS</text>
  <text x="80" y="280" font-family="Cormorant Garamond, serif" font-size="80" font-weight="500" fill="#fafafa">Audio. Visual.</text>
  <text x="80" y="360" font-family="Cormorant Garamond, serif" font-size="80" font-weight="500" fill="#fafafa">Simulation.</text>
  <text x="80" y="440" font-family="Cormorant Garamond, serif" font-size="80" font-weight="500" fill="#c084fc" font-style="italic">Generative.</text>
  <text x="80" y="540" font-family="JetBrains Mono, monospace" font-size="22" fill="#a78bfa">${escapeXml("By Kesava · 11 toys, all in your browser")}</text>
  <text x="${W - 80}" y="${H - 60}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="14" fill="#71717a">toys.iamkesava.com</text>
</svg>`;
}
async function writeOg() {
  const ogDir = join(PUB, "og");
  await rm(ogDir, { recursive: true, force: true });
  await mkdir(ogDir, { recursive: true });
  await writeFile(join(ogDir, "default.svg"), ogSvg());
}

async function main() {
  const groups = await parseToys();
  console.log(`prebuild-aeo: ${groups.flatMap((g) => g.apps).length} toys, ${groups.length} categories`);
  await writeLlms(groups);
  await writeAgentPermissions(groups);
  await writeOg();
  console.log("prebuild-aeo: wrote llms.txt, agent-permissions.json, og/default.svg");
}
main().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env node
// aggregate-toys.mjs — pull each external toy's index.html from GitHub
// and place it under public/<slug>/ so toys.iamkesava.com/<slug>/ becomes
// the canonical URL for every toy. The original k3sava.github.io/<slug>/
// URL stays alive for code-share, but iamkesava.com gets the citations,
// authority, and traffic.
//
// Each toy is a single-file repo (index.html at root). We:
//   1. Download index.html from raw.githubusercontent.com
//   2. Inject `<link rel="canonical" href="https://toys.iamkesava.com/<slug>/">`
//   3. Inject Schema.org @graph (CreativeWork) for the page
//   4. Save to public/<slug>/index.html
//
// Run via `npm run prebuild` (auto-runs before `next build`).

import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const PUB = join(ROOT, "public");
const SITE = "https://toys.iamkesava.com";
const GH = "https://raw.githubusercontent.com/k3sava";

// Per-toy metadata. Keep aligned with src/data/toys.ts.
const TOYS = [
  { slug: "sonicc",        name: "sonicc",        category: "Audio",      keywords: "music, drums, synth, sequencer", description: "Keys, drums, pattern sequencer, sampler, and mic recorder. 16 presets, 9 waveforms, 12 FX, stereo knobs, MIDI support, WAV export." },
  { slug: "plink",         name: "Plink",         category: "Audio",      keywords: "audio, plinko, pentatonic", description: "Drop marbles and hear them play. A pentatonic plinko board where every bounce is a note. Click pegs to toggle them." },
  { slug: "synth-pad",     name: "Synth Pad",     category: "Audio",      keywords: "synth, audio, XY pad", description: "Touch or click and drag to play. An XY pad instrument with pentatonic tuning and warm oscillators." },
  { slug: "kaleidoscopic", name: "Kaleidoscopic", category: "Visual",     keywords: "WebGL, kaleidoscope, image", description: "Upload any image and watch it fold into living geometry. 8 symmetry patterns, real-time WebGL rendering, video recording." },
  { slug: "aurora",        name: "Aurora",        category: "Visual",     keywords: "ambient, generative, light", description: "Move your cursor through living light. An interactive aurora borealis rendered in real time." },
  { slug: "string-art",    name: "String Art",    category: "Visual",     keywords: "generative, geometry, modular", description: "Modular multiplication on geometric shapes creates impossibly intricate patterns. Move your cursor to shape the strings." },
  { slug: "gravity-type",  name: "Gravity Type",  category: "Simulation", keywords: "physics, type, gravity", description: "Type anything and watch it fall. Letters tumble, stack, and scatter with real physics. Click to explode." },
  { slug: "particle-life", name: "Particle Life", category: "Simulation", keywords: "particles, simulation, emergence", description: "Colored particles follow simple attraction rules and create complex, organic behavior. Click to create a new universe." },
  { slug: "aurea",         name: "Aurea",         category: "Generative", keywords: "math art, fibonacci, parametric", description: "Fibonacci-driven parametric line art. 6 original forms, 4K rendering, video recording. Thousands of lines from pure equations, biology from math." },
  {
    slug: "form",
    name: "FORM",
    category: "Generative",
    keywords: "typography, poster, generative, design systems",
    description: "Type a phrase, the system arranges it like a typographer. Five design philosophies (Swiss, Editorial, Brutalist, Kinetic, Painterly) plus a blend lab. PNG or video.",
    subpaths: ["", "swiss", "editorial", "shared/style.css", "shared/app.js", "shared/parse.js", "shared/philosophies/swiss.js", "shared/philosophies/editorial.js"],
  },
];

async function fetchToyHtml(slug) {
  // Try main first, then master. Most repos use main.
  for (const branch of ["main", "master"]) {
    const url = `${GH}/${slug}/${branch}/index.html`;
    const res = await fetch(url, { headers: { "User-Agent": "little-toys-aggregator" } });
    if (res.ok) return await res.text();
  }
  throw new Error(`could not fetch index.html for ${slug} from main or master`);
}

function injectCanonical(html, slug, name, description, keywords) {
  const url = `${SITE}/${slug}/`;
  const ldGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": url,
        name,
        description,
        url,
        keywords,
        author: { "@type": "Person", name: "Kesava", url: "https://iamkesava.com" },
        publisher: { "@type": "Organization", name: "little toys", url: SITE },
        codeRepository: `https://github.com/k3sava/${slug}`,
        license: "https://opensource.org/licenses/MIT",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "iamkesava", item: "https://iamkesava.com" },
          { "@type": "ListItem", position: 2, name: "toys", item: SITE + "/" },
          { "@type": "ListItem", position: 3, name, item: url },
        ],
      },
    ],
  };
  const inject = `
    <link rel="canonical" href="${url}">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${name}, by Kesava">
    <meta property="og:description" content="${description.replace(/"/g, "&quot;")}">
    <meta property="og:image" content="${url}og.svg">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${name}, by Kesava">
    <meta name="twitter:description" content="${description.replace(/"/g, "&quot;")}">
    <meta name="twitter:image" content="${url}og.svg">
    <meta name="author" content="Kesava">
    <meta name="description" content="${description.replace(/"/g, "&quot;")}">
    <script type="application/ld+json">${JSON.stringify(ldGraph)}</script>
  `;
  // Insert before </head>; if no </head>, prepend the document.
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${inject}\n  </head>`);
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => m + inject);
  }
  // No <head>: wrap minimally.
  return `<!doctype html>\n<html><head>${inject}</head>\n${html}\n</html>`;
}

const W = 1200, H = 630;
function escapeXml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
}
function ogSvg(toy) {
  const accent = ({ Audio: "#ec4899", Visual: "#8b5cf6", Simulation: "#06b6d4", Generative: "#f59e0b" })[toy.category] || "#c084fc";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f0f1e"/>
      <stop offset="1" stop-color="#1a1530"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="${accent}"/>
  <g transform="translate(80, 60)">
    <circle cx="0" cy="14" r="6" fill="#c084fc"/>
    <text x="16" y="20" font-family="DM Sans, system-ui, sans-serif" font-size="22" fill="#fafafa">little toys</text>
  </g>
  <text x="80" y="180" font-family="JetBrains Mono, monospace" font-size="16" fill="${accent}" letter-spacing="2">${escapeXml(toy.category.toUpperCase())}</text>
  <text x="80" y="290" font-family="Cormorant Garamond, serif" font-size="86" font-weight="500" fill="#fafafa">${escapeXml(toy.name)}</text>
  <text x="80" y="380" font-family="Source Serif 4, serif" font-size="28" fill="#a78bfa">${escapeXml(toy.description.slice(0, 90))}</text>
  <text x="80" y="540" font-family="JetBrains Mono, monospace" font-size="20" fill="#a78bfa">By Kesava</text>
  <text x="${W - 80}" y="${H - 60}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="14" fill="#71717a">toys.iamkesava.com/${escapeXml(toy.slug)}/</text>
</svg>`;
}

async function main() {
  let ok = 0, fail = 0;
  for (const toy of TOYS) {
    const dir = join(PUB, toy.slug);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const subpaths = toy.subpaths || [""];
    let allOk = true;
    for (const sub of subpaths) {
      try {
        const isAsset = sub.endsWith(".css") || sub.endsWith(".js");
        const fetchPath = sub === "" ? "index.html" : (isAsset ? sub : `${sub}/index.html`);

        let content = null;
        for (const branch of ["main", "master"]) {
          const url = `${GH}/${toy.slug}/${branch}/${fetchPath}`;
          const res = await fetch(url, { headers: { "User-Agent": "little-toys-aggregator" } });
          if (res.ok) { content = await res.text(); break; }
        }
        if (content === null) throw new Error(`could not fetch ${fetchPath}`);

        const localPath = sub === "" ? "index.html" : (isAsset ? sub : `${sub}/index.html`);
        const fullLocal = join(dir, localPath);
        await mkdir(join(fullLocal, ".."), { recursive: true });

        if (isAsset) {
          await writeFile(fullLocal, content);
        } else {
          const subSlug = toy.slug + (sub ? "/" + sub : "");
          const pageName = sub === "" ? toy.name : `${toy.name} — ${sub[0].toUpperCase() + sub.slice(1)}`;
          const enriched = injectCanonical(content, subSlug, pageName, toy.description, toy.keywords);
          await writeFile(fullLocal, enriched);
        }
      } catch (e) {
        console.log(`  ✗ ${toy.slug}/${sub || "(root)"}: ${e.message}`);
        allOk = false;
      }
    }
    if (allOk) {
      await writeFile(join(dir, "og.svg"), ogSvg(toy));
      console.log(`  ✓ ${toy.slug} (${subpaths.length} path${subpaths.length===1?'':'s'})`);
      ok++;
    } else {
      fail++;
    }
  }
  console.log(`\naggregate-toys: ${ok} aggregated, ${fail} failed`);
  if (fail > 0 && fail === TOYS.length) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });

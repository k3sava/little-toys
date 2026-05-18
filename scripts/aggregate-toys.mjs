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
import { Buffer } from "node:buffer";
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
    subpaths: ["", "swiss", "editorial", "brutalist", "kinetic", "painterly", "mycelium", "blend", "shared/style.css", "shared/app.js", "shared/parse.js", "shared/layout.js", "shared/philosophies/swiss.js", "shared/philosophies/editorial.js", "shared/philosophies/brutalist.js", "shared/philosophies/kinetic.js", "shared/philosophies/painterly.js", "shared/philosophies/mycelium.js", "shared/philosophies/blend.js", "shared/knowledge/designers.json"],
  },
  {
    slug: "pixart",
    name: "pixart",
    category: "Visual",
    keywords: "image, video, effects, canvas, generative, ascii, dither, crt, halftone, kaleidoscope, slit-scan, flow-field, ink-wash, watercolor",
    description: "Drop an image or video, pick an effect. 28 client-side canvas image/video effects (ascii, bevel, bloom, cellular, contour, crosshatch, crt, displace, distort, dithering, dots, edge, film-grain, flow-field, gradients, halftone-cmyk, ink-wash, kaleidoscope, mosaic, patterns, pixel-sort, recolor, rgb-shift, scatter, slit-scan, stippling, voronoi, watercolor). 20 s seamless loop, per-effect mode systems, PNG + MP4 export, keyboard shortcuts.",
    subpaths: [
      "",
      "ascii/effect.js", "ascii/index.html",
      "bevel/effect.js", "bevel/index.html",
      "bloom/effect.js", "bloom/index.html",
      "cellular/effect.js", "cellular/index.html",
      "contour/effect.js", "contour/index.html",
      "crosshatch/effect.js", "crosshatch/index.html",
      "crt/effect.js", "crt/index.html",
      "displace/effect.js", "displace/index.html",
      "distort/effect.js", "distort/index.html", "distort/assets/displacement.png",
      "dithering/effect.js", "dithering/index.html",
      "dots/effect.js", "dots/index.html",
      "edge/effect.js", "edge/index.html",
      "film-grain/effect.js", "film-grain/index.html",
      "flow-field/effect.js", "flow-field/index.html",
      "gradients/effect.js", "gradients/index.html",
      "halftone-cmyk/effect.js", "halftone-cmyk/index.html",
      "ink-wash/effect.js", "ink-wash/index.html",
      "kaleidoscope/effect.js", "kaleidoscope/index.html",
      "mosaic/effect.js", "mosaic/index.html",
      "patterns/effect.js", "patterns/index.html",
      "patterns/patterns/pattern-1.png", "patterns/patterns/pattern-2.png",
      "patterns/patterns/pattern-3.png", "patterns/patterns/pattern-4.png",
      "patterns/patterns/pattern-5.png", "patterns/patterns/pattern-6.png",
      "pixel-sort/effect.js", "pixel-sort/index.html",
      "recolor/effect.js", "recolor/index.html",
      "rgb-shift/effect.js", "rgb-shift/index.html",
      "scatter/effect.js", "scatter/index.html",
      "slit-scan/effect.js", "slit-scan/index.html",
      "stippling/effect.js", "stippling/index.html",
      "voronoi/effect.js", "voronoi/index.html",
      "watercolor/effect.js", "watercolor/index.html",
      "shared/chrome.css", "shared/gui.css", "shared/gui.js",
      "shared/theme.js", "shared/state.js", "shared/export.js",
      "shared/keys.js", "shared/theme-tokens.css",
      "assets/samples/portrait.jpg", "assets/samples/landscape.jpg",
      "assets/samples/macro.jpg", "assets/samples/cityscape.jpg",
      "assets/samples/clip.mp4",
      "assets/thumbs/ascii.webp", "assets/thumbs/bevel.webp",
      "assets/thumbs/bloom.webp", "assets/thumbs/cellular.webp",
      "assets/thumbs/contour.webp", "assets/thumbs/crosshatch.webp",
      "assets/thumbs/crt.webp", "assets/thumbs/displace.webp",
      "assets/thumbs/distort.webp", "assets/thumbs/dithering.webp",
      "assets/thumbs/dots.webp", "assets/thumbs/edge.webp",
      "assets/thumbs/film-grain.webp", "assets/thumbs/flow-field.webp",
      "assets/thumbs/gradients.webp", "assets/thumbs/halftone-cmyk.webp",
      "assets/thumbs/ink-wash.webp", "assets/thumbs/kaleidoscope.webp",
      "assets/thumbs/mosaic.webp", "assets/thumbs/patterns.webp",
      "assets/thumbs/pixel-sort.webp", "assets/thumbs/recolor.webp",
      "assets/thumbs/rgb-shift.webp", "assets/thumbs/scatter.webp",
      "assets/thumbs/slit-scan.webp", "assets/thumbs/stippling.webp",
      "assets/thumbs/voronoi.webp", "assets/thumbs/watercolor.webp",
      "assets/previews/ascii.mp4", "assets/previews/bevel.mp4",
      "assets/previews/bloom.mp4", "assets/previews/cellular.mp4",
      "assets/previews/contour.mp4", "assets/previews/crosshatch.mp4",
      "assets/previews/crt.mp4", "assets/previews/displace.mp4",
      "assets/previews/distort.mp4", "assets/previews/dithering.mp4",
      "assets/previews/dots.mp4", "assets/previews/edge.mp4",
      "assets/previews/film-grain.mp4", "assets/previews/flow-field.mp4",
      "assets/previews/gradients.mp4", "assets/previews/halftone-cmyk.mp4",
      "assets/previews/ink-wash.mp4", "assets/previews/kaleidoscope.mp4",
      "assets/previews/mosaic.mp4", "assets/previews/patterns.mp4",
      "assets/previews/pixel-sort.mp4", "assets/previews/recolor.mp4",
      "assets/previews/rgb-shift.mp4", "assets/previews/scatter.mp4",
      "assets/previews/slit-scan.mp4", "assets/previews/stippling.mp4",
      "assets/previews/voronoi.mp4", "assets/previews/watercolor.mp4",
    ],
  },
  {
    slug: "wordart",
    name: "wordart",
    category: "Generative",
    keywords: "typography, type, effects, canvas, generative, neon, glitch, pixel art, wave",
    description: "Type a phrase, switch effects. Sixteen canvas typography effects with shared chrome, animate + interactive modes, PNG and 15s loopable MP4 export. Keyboard shortcuts to switch effects (1-9), theme (T), and more.",
    subpaths: [
      "",
      "blur", "blur/effect.js",
      "dither", "dither/effect.js",
      "echo", "echo/effect.js",
      "glitch", "glitch/effect.js",
      "halftone", "halftone/effect.js",
      "line", "line/effect.js", "line/effect.css",
      "mesh", "mesh/effect.js",
      "neon", "neon/effect.js",
      "noise", "noise/effect.js",
      "outline", "outline/effect.js",
      "pixel", "pixel/effect.js",
      "ripple", "ripple/effect.js",
      "shadow", "shadow/effect.js",
      "slice", "slice/effect.js",
      "type", "type/effect.js",
      "wave", "wave/effect.js",
      "shared/chrome.css", "shared/gui.css", "shared/gui.js",
      "shared/theme.js", "shared/state.js", "shared/export.js",
      "shared/keys.js", "shared/theme-tokens.css",
    ],
  },
  {
    slug: "poster",
    name: "poster",
    category: "Generative",
    keywords: "typography, poster, generative, design, art direction, editorial",
    description: "Type a phrase, idea, or article. Two art directors compose two completely different posters. 12 directors, 10 template families, 45,408 variants. Every decision is shown. Every decision is editable. Deterministic — same input, same output.",
    subpaths: [
      "",
      "shared/style.css",
      "shared/chrome.css", "shared/gui.css", "shared/theme.js", "shared/theme-tokens.css",
      "shared/parse.js", "shared/seed.js", "shared/article.js",
      "shared/templateParams.js", "shared/layout.js", "shared/mycelium.js",
      "shared/conceit.js", "shared/archetypes.js",
      "shared/director.js", "shared/render.js", "shared/app.js",
      "shared/knowledge/designers.json",
    ],
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

// Inject canonical sister-site chrome into a toy's HTML:
//   - <link>/<script> tags pointing to /_chrome/* (served from this repo)
//   - Theme switcher (top-left), breadcrumb (top-left), shortcut hint (top-right)
//   - Fixed footer (sister sites + made by Kesava + github link) at bottom
//   - Optional splash overlay (only when toy doesn't already have one)
//
// Idempotent: if the HTML already contains kami-breadcrumb or
// theme-switcher-container, the chrome is assumed to be in place (this is
// true for wordart/pixart/form/poster which ship their own copies).
// Toys that capture every key as input — pressing T would both cycle the
// theme AND type a letter. Disable the T-shortcut for these; users click
// the theme switcher pill instead.
const KEY_CAPTURE_TOYS = new Set(["gravity-type"]);

function injectChrome(html, slug, name, description, isSubpage) {
  // A toy is "already chromed" if it has any of the canonical kami markup
  // (wordart/pixart/form/poster), OR sonicc's homegrown equivalent (.theme-sw +
  // .crumb + .kami-footer). In that case we leave it alone — bolting on a
  // second copy creates the overlap the user explicitly warned about.
  const hasKamiBreadcrumb = /class=["'][^"']*\bkami-breadcrumb\b/i.test(html);
  const hasKamiFooter     = /class=["'][^"']*\bkami-footer\b/i.test(html);
  const hasThemeSwitcher  = /class=["'][^"']*\btheme-switcher-container\b/i.test(html);
  const hasSoniccTheme    = /class=["'][^"']*\btheme-sw\b/i.test(html);
  const hasSoniccCrumb    = /class=["'][^"']*\bcrumb\b/i.test(html) && /https:\/\/iamkesava\.com/.test(html);
  if (hasKamiBreadcrumb || hasKamiFooter || hasThemeSwitcher || (hasSoniccTheme && hasSoniccCrumb)) {
    // The toy has its own chrome. Rewrite the breadcrumb to point to the
    // toys hub so the served-from-toys.iamkesava.com path stays canonical.
    return rewriteOwnBreadcrumb(html, slug, name);
  }

  // Already has its own splash (plink, synth-pad, kaleidoscopic, etc.) —
  // skip the kami splash so we don't double-overlay. Tighter regex: must
  // be a full class/id value, not a prefix of something else like
  // "splash-essentials". Matches `id="splash"`, `class="splash"`,
  // `class="splash other"`, `class="other splash"`, etc.
  const hasOwnSplash =
    /\bid\s*=\s*["'](?:splash|loading-overlay|loading-screen|intro-overlay)["']/i.test(html) ||
    /\bclass\s*=\s*["'][^"']*(?:^|\s)(?:splash|loading-overlay|loading-screen|intro-overlay)(?:\s|["'])/i.test(html);

  // Use absolute paths so chrome loads from any subdirectory depth.
  const rootSlug = slug.split("/")[0];
  const skipKeyShortcuts = KEY_CAPTURE_TOYS.has(rootSlug);
  const headInject = `
    <link rel="stylesheet" href="/_chrome/chrome.css">
    ${skipKeyShortcuts ? `<script>document.documentElement.setAttribute("data-kami-shortcuts","off");</script>` : ""}
    <script src="/_chrome/theme.js" defer></script>
    <script src="/_chrome/splash.js" defer></script>
  `;

  // Parent breadcrumb crumb: on a subpage like /pixart/blur/, parent is
  // pixart itself (../). On the root, parent is the toys hub.
  const parentHref = isSubpage ? "../" : "https://toys.iamkesava.com/";
  const parentLabel = isSubpage ? slug.split("/")[0] : "toys";
  const currentLabel = isSubpage ? slug.split("/").slice(1).join(" — ") : name;

  const bodyInject = `
<div class="theme-switcher-container">
  <button class="theme-switcher-pill" type="button" aria-label="Cycle theme (T)" title="Cycle theme (T)">
    <span class="theme-switcher-pill-icon">○</span>
  </button>
</div>
<nav class="kami-breadcrumb-fixed" aria-label="Breadcrumb">
  <a href="https://iamkesava.com">home</a><span class="sep">·</span>
  ${isSubpage
    ? `<a href="https://toys.iamkesava.com/">toys</a><span class="sep">·</span><a href="${parentHref}">${parentLabel}</a><span class="sep">·</span><span class="current">${currentLabel}</span>`
    : `<a href="${parentHref}">${parentLabel}</a><span class="sep">·</span><span class="current">${currentLabel}</span>`
  }
</nav>
${skipKeyShortcuts ? "" : `<div class="kami-shortcut-hint" aria-hidden="true">
  <kbd>T</kbd> theme
</div>`}
${hasOwnSplash ? "" : `<div class="kami-splash" role="status" aria-live="polite">
  <h1 class="kami-splash-name">${escapeHtml(name)}</h1>
  <p class="kami-splash-tag">${escapeHtml(description.slice(0, 90))}</p>
  <span class="kami-splash-dot"></span>
  <div class="kami-splash-skip">press <kbd>esc</kbd> or click to begin</div>
</div>`}
<footer class="kami-footer-fixed" role="contentinfo">
  <a href="https://apps.iamkesava.com/">apps</a>
  <span class="dot" aria-hidden="true">·</span>
  <a href="https://tools.iamkesava.com/">tools</a>
  <span class="dot" aria-hidden="true">·</span>
  <a href="https://toys.iamkesava.com/" aria-current="page" style="font-weight:600;color:var(--kami-text);">toys</a>
  <span class="dot" aria-hidden="true">·</span>
  <a href="https://codex.iamkesava.com/">codex</a>
  <span class="dot" aria-hidden="true">·</span>
  <a href="https://iamkesava.com" rel="author">kesava</a>
  <span class="dot" aria-hidden="true">·</span>
  <a href="https://github.com/k3sava/${slug.split("/")[0]}" rel="noopener">github</a>
</footer>
`;

  let out = html;
  // Insert head assets before </head>.
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${headInject}\n  </head>`);
  } else if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => m + headInject);
  } else {
    out = `<!doctype html>\n<html><head>${headInject}</head>\n${out}\n</html>`;
  }
  // Insert chrome markup just after <body ...>. If no <body>, prepend.
  if (/<body[^>]*>/i.test(out)) {
    out = out.replace(/<body[^>]*>/i, (m) => m + bodyInject);
  } else {
    out = out + bodyInject;
  }
  return out;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// When a toy ships its own chrome, ensure the breadcrumb points to the toys
// hub. If it already does (wordart/pixart family already inject the correct
// crumb), leave it alone. If it points elsewhere (sonicc → apps), rewrite.
function rewriteOwnBreadcrumb(html, slug, name) {
  const re = /(<nav\b[^>]*\bclass\s*=\s*["'][^"']*\b(?:crumb|kami-breadcrumb)\b[^"']*["'][^>]*>)([\s\S]*?)(<\/nav>)/i;
  const m = html.match(re);
  if (!m) return html;
  // Already pointing to toys.iamkesava.com — leave it alone.
  if (/toys\.iamkesava\.com/.test(m[2])) return html;
  const inner =
    `<a href="https://iamkesava.com">home</a><span class="sep">&middot;</span>` +
    `<a href="https://toys.iamkesava.com/">toys</a><span class="sep">&middot;</span>` +
    `<span class="current">${escapeHtml(name)}</span>`;
  return html.replace(re, (_, open, _mid, close) => `${open}${inner}${close}`);
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
    // Asset classification:
    //   directory  — sub is a bare slug like "line" or "shared", aggregator
    //                fetches `${sub}/index.html` and rewrites the HTML.
    //   text-asset — code/markup: .css .js .json .html. Fetched verbatim.
    //   binary     — images/video/font: .png .jpg .mp4 etc. Fetched as bytes.
    const TEXT_EXT = /\.(css|js|json|html)$/i;
    const BIN_EXT  = /\.(png|jpe?g|gif|webp|svg|ico|mp4|webm|mov|m4v|woff2?|ttf|otf|wasm)$/i;
    for (const sub of subpaths) {
      try {
        const isText = TEXT_EXT.test(sub);
        const isBin  = BIN_EXT.test(sub);
        const isAsset = isText || isBin;
        const fetchPath = sub === "" ? "index.html" : (isAsset ? sub : `${sub}/index.html`);

        let content = null;
        for (const branch of ["main", "master"]) {
          const url = `${GH}/${toy.slug}/${branch}/${fetchPath}`;
          const res = await fetch(url, { headers: { "User-Agent": "little-toys-aggregator" } });
          if (res.ok) {
            content = isBin ? Buffer.from(await res.arrayBuffer()) : await res.text();
            break;
          }
        }
        if (content === null) throw new Error(`could not fetch ${fetchPath}`);

        const localPath = sub === "" ? "index.html" : (isAsset ? sub : `${sub}/index.html`);
        const fullLocal = join(dir, localPath);
        await mkdir(join(fullLocal, ".."), { recursive: true });

        if (isBin) {
          await writeFile(fullLocal, content);
        } else if (isText) {
          // HTML text-assets (e.g. /pixart/<effect>/index.html) get canonical
          // injection same as the toy root. CSS/JS/JSON pass through verbatim.
          if (sub.endsWith(".html")) {
            const subSlug = toy.slug + "/" + sub.replace(/\/?index\.html$/, "");
            const pageName = `${toy.name} — ${sub.split("/")[0]}`;
            content = injectCanonical(content, subSlug, pageName, toy.description, toy.keywords);
            content = injectChrome(content, subSlug, pageName, toy.description, true);
          }
          await writeFile(fullLocal, content);
        } else {
          // Directory — fetched its index.html, write to <sub>/index.html.
          const subSlug = toy.slug + (sub ? "/" + sub : "");
          const pageName = sub === "" ? toy.name : `${toy.name} — ${sub[0].toUpperCase() + sub.slice(1)}`;
          let enriched = injectCanonical(content, subSlug, pageName, toy.description, toy.keywords);
          enriched = injectChrome(enriched, subSlug, pageName, toy.description, sub !== "");
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

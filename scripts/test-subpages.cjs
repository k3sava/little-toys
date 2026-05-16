#!/usr/bin/env node
// Quick spot-check of subpages: wordart/blur, pixart/ascii, form/swiss, poster
// — verify chrome is intact and no JS errors beyond environment noise.
const { chromium } = require("playwright-core");
const fs = require("node:fs/promises");
const path = require("node:path");

const URLS = [
  "/wordart/blur/",
  "/pixart/ascii/",
  "/form/swiss/",
];

const SCREENS = path.join(process.cwd(), "scripts/__screens__");

(async () => {
  await fs.mkdir(SCREENS, { recursive: true });
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"],
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const NOISE = /ERR_CERT_AUTHORITY_INVALID|fonts\.googleapis\.com|unpkg\.com|cdn\.jsdelivr\.net|Failed to load resource/i;
  for (const u of URLS) {
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", e => { if (!NOISE.test(e.message)) errs.push("PAGEERROR: " + e.message); });
    p.on("console", m => { if (m.type() === "error" && !NOISE.test(m.text())) errs.push("CONSOLE: " + m.text()); });
    await p.goto("http://localhost:4321" + u, { waitUntil: "domcontentloaded" });
    await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForTimeout(900);
    await p.mouse.click(640, 400).catch(() => {});
    await p.waitForTimeout(300);
    const chromeOk = await p.evaluate(() => ({
      breadcrumb: !!document.querySelector(".kami-breadcrumb-fixed, .kami-breadcrumb, nav.crumb"),
      footer: !!document.querySelector(".kami-footer-fixed, .kami-footer, .wa-bottom, footer"),
      theme: !!document.querySelector(".theme-switcher-container .theme-switcher-pill, .theme-sw"),
    }));
    const tag = errs.length === 0 && chromeOk.breadcrumb && chromeOk.footer && chromeOk.theme ? "✓" : "✗";
    console.log(`  ${tag} ${u.padEnd(18)} bc=${+chromeOk.breadcrumb} ft=${+chromeOk.footer} th=${+chromeOk.theme} err=${errs.length}`);
    if (errs.length) errs.slice(0, 3).forEach(e => console.log("    " + e));
    const name = u.replace(/\//g, "_").replace(/^_|_$/g, "") || "root";
    await p.screenshot({ path: path.join(SCREENS, `sub-${name}.png`) });
    await p.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

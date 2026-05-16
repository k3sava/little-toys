#!/usr/bin/env node
// Smoke-test every aggregated toy: load the URL, capture console errors,
// confirm the kami chrome is present and not obviously broken, screenshot,
// dismiss splash, and screenshot again. Reports per-toy status.

const { chromium } = require("playwright-core");
const fs = require("node:fs/promises");
const path = require("node:path");

const TOYS = [
  // Toys where we inject the kami chrome.
  { slug: "sonicc",        own: false },
  { slug: "plink",         own: false }, // own splash
  { slug: "synth-pad",     own: false }, // own splash
  { slug: "kaleidoscopic", own: false },
  { slug: "aurora",        own: false },
  { slug: "string-art",    own: false }, // own splash
  { slug: "gravity-type",  own: false }, // own splash
  { slug: "particle-life", own: false }, // own splash
  { slug: "aurea",         own: false },
  // Toys that already ship their own kami chrome (wordart family).
  { slug: "wordart",       own: true  },
  { slug: "pixart",        own: true  },
  { slug: "form",          own: true  },
  { slug: "poster",        own: true  },
];

const BASE = "http://localhost:4321";
const SCREENS = path.join(process.cwd(), "scripts/__screens__");

(async () => {
  await fs.mkdir(SCREENS, { recursive: true });

  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const results = [];
  for (const toy of TOYS) {
    const url = `${BASE}/${toy.slug}/`;
    const errors = [];
    const warnings = [];
    const page = await context.newPage();
    // Env noise we don't care about: external font CDNs and unpkg blocked
    // by this sandbox, and "Failed to load resource" generic console echoes.
    const NOISE = /ERR_CERT_AUTHORITY_INVALID|fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com|cdn\.jsdelivr\.net|Failed to load resource/i;
    page.on("pageerror", (e) => { if (!NOISE.test(e.message)) errors.push("PAGEERROR: " + e.message); });
    page.on("console", (msg) => {
      if (msg.type() === "error") { if (!NOISE.test(msg.text())) errors.push("CONSOLE: " + msg.text()); }
      if (msg.type() === "warning") warnings.push("WARN: " + msg.text());
    });
    page.on("requestfailed", (req) => {
      const f = req.failure();
      if (f && /aborted/i.test(f.errorText)) return;
      if (NOISE.test(req.url())) return;
      errors.push(`REQ FAIL: ${req.url()} → ${f?.errorText}`);
    });

    let status = "ok";
    let chromeOk = { breadcrumb: false, footer: false, theme: false, splashHandled: true };
    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
      if (!resp || !resp.ok()) { status = "fail"; errors.push("nav: " + resp?.status()); }
      // Clear storage so theme state from prior runs doesn't pollute T-cycle.
      await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(_){} });
      // Reload so chrome's initial-theme code reads the cleared state.
      await page.reload({ waitUntil: "domcontentloaded" });
      // Let the page settle a bit so theme.js runs and any splash dismisses.
      await page.waitForTimeout(800);

      // Check kami chrome. wordart-family toys (wordart/pixart/form/poster) ship
      // their own kami chrome with classes .kami-breadcrumb / .wa-bottom.
      // Sonicc ships .crumb + .kami-footer + .theme-sw as its homegrown variant.
      chromeOk.breadcrumb = await page.locator(".kami-breadcrumb-fixed, .kami-breadcrumb, nav.crumb").count() > 0;
      chromeOk.footer = await page.locator(".kami-footer-fixed, .kami-footer, .wa-bottom, footer").count() > 0;
      chromeOk.theme = await page.locator(".theme-switcher-container .theme-switcher-pill, .theme-sw").count() > 0;

      // Screenshot before dismissing splash.
      await page.screenshot({ path: path.join(SCREENS, `${toy.slug}-01-load.png`), fullPage: false });

      // Dismiss any splash by pressing Escape (kami splash) and clicking center.
      await page.keyboard.press("Escape").catch(() => {});
      await page.mouse.click(640, 400).catch(() => {});
      await page.waitForTimeout(800);

      // Cycle theme using T key, then check html[data-theme] changed.
      await page.evaluate(() => { localStorage.removeItem("kami.theme"); document.documentElement.removeAttribute("data-theme"); });
      await page.waitForTimeout(50);
      await page.keyboard.press("KeyT");
      await page.waitForTimeout(150);
      const themeAfterT = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
      chromeOk.themeKeyWorks = !!themeAfterT;

      await page.screenshot({ path: path.join(SCREENS, `${toy.slug}-02-after.png`), fullPage: false });
    } catch (e) {
      status = "error";
      errors.push("EXC: " + e.message);
    }
    await page.close();

    const summary = {
      slug: toy.slug,
      status,
      chrome: chromeOk,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors: errors.slice(0, 5),
    };
    results.push(summary);
    const tag = (errors.length === 0 && status === "ok" && chromeOk.breadcrumb && chromeOk.footer && chromeOk.theme) ? "✓" : "✗";
    const themeTxt = chromeOk.themeKeyWorks ? "T:ok" : "T:??";
    console.log(`  ${tag} ${toy.slug.padEnd(16)} bc=${+chromeOk.breadcrumb} ft=${+chromeOk.footer} th=${+chromeOk.theme} ${themeTxt} err=${errors.length}`);
    if (errors.length) errors.slice(0, 3).forEach((e) => console.log(`      ${e}`));
  }

  await context.close();
  await browser.close();

  await fs.writeFile(path.join(SCREENS, "results.json"), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => r.status !== "ok" || !r.chrome.breadcrumb || !r.chrome.footer || !r.chrome.theme);
  console.log(`\n${results.length - failed.length}/${results.length} toys passed chrome check`);
  if (failed.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });

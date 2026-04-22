"use client";

import { useMemo, useState } from "react";
import { AppCard } from "@/components/app-card";
import { Breadcrumb } from "@/components/breadcrumb";
import { Footer } from "@/components/footer";

const groups = [
  {
    label: "Audio",
    apps: [
      { title: "sonicc", badge: "music", description: "Keys, drums, pattern sequencer, sampler, and mic recorder. 16 presets, 9 waveforms, 12 FX, stereo knobs, MIDI support, and WAV export.", href: "https://k3sava.github.io/sonicc/", external: true },
      { title: "Stem Studio", badge: "AI audio", description: "Upload any song and split it into vocals, drums, bass, and other stems with AI. Effects, pitch shift, time stretch, sample maker, and mix export.", href: "https://apps.iamkesava.com/playground/stem-studio", external: true },
      { title: "Plink", badge: "audio", description: "Drop marbles and hear them play. A pentatonic plinko board where every bounce is a note. Click pegs to toggle them.", href: "https://k3sava.github.io/plink/", external: true },
      { title: "Synth Pad", badge: "audio", description: "Touch or click and drag to play. An XY pad instrument with pentatonic tuning and warm oscillators.", href: "https://k3sava.github.io/synth-pad/", external: true },
    ],
  },
  {
    label: "Visual",
    apps: [
      { title: "Kaleidoscopic", badge: "WebGL", description: "Upload any image and watch it fold into living geometry. 8 symmetry patterns, real-time WebGL rendering, video recording.", href: "https://k3sava.github.io/kaleidoscopic/", external: true },
      { title: "Aurora", badge: "ambient", description: "Move your cursor through living light. An interactive aurora borealis rendered in real time.", href: "https://k3sava.github.io/aurora/", external: true },
      { title: "String Art", badge: "generative", description: "Modular multiplication on geometric shapes creates impossibly intricate patterns. Move your cursor to shape the strings.", href: "https://k3sava.github.io/string-art/", external: true },
    ],
  },
  {
    label: "Simulation",
    apps: [
      { title: "Gravity Type", badge: "physics", description: "Type anything and watch it fall. Letters tumble, stack, and scatter with real physics. Click to explode.", href: "https://k3sava.github.io/gravity-type/", external: true },
      { title: "Particle Life", badge: "simulation", description: "Colored particles follow simple attraction rules and create complex, organic behavior. Click to create a new universe.", href: "https://k3sava.github.io/particle-life/", external: true },
    ],
  },
  {
    label: "Generative",
    apps: [
      { title: "Aurea", badge: "math art", description: "Fibonacci-driven parametric line art. 6 original forms, 4K rendering, video recording. Thousands of lines from pure equations — biology from math.", href: "https://k3sava.github.io/aurea/", external: true },
    ],
  },
  {
    label: "Craft",
    apps: [
      { title: "Zen Garden", badge: "CSS art", description: "Ink & Void — a CSS Zen Garden submission. 1800+ lines of pure CSS: scroll-driven animations, oklch color, @property, subgrid. Zero images, zero JS.", href: "https://apps.iamkesava.com/playground/zen-garden", external: true },
    ],
  },
];

const allApps = groups.flatMap((g) => g.apps);

export function ToysHubContent() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return allApps.filter((app) =>
      [app.title, app.badge, app.description].join(" ").toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="kami-scope min-h-screen" style={{ color: "var(--kami-text)" }}>
      <Breadcrumb
        items={[
          { label: "home", href: "https://iamkesava.com" },
          { label: "apps", href: "https://apps.iamkesava.com" },
          { label: "toys" },
        ]}
      />

      <div className="mx-auto w-[92%] max-w-[1600px] py-12 sm:py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--kami-text)" }}>
            Toys
          </h1>
          <p className="mt-3" style={{ color: "var(--kami-text-muted)" }}>
            Creative experiments and interactive toys.
          </p>
        </div>

        <div
          className="mb-8 p-4 sm:p-5"
          style={{
            background: "var(--kami-surface-solid)",
            border: "var(--kami-card-border)",
            borderRadius: "var(--kami-card-radius)",
            boxShadow: "var(--kami-card-shadow)",
          }}
        >
          <label htmlFor="toys-search" className="mb-2 block text-sm font-medium" style={{ color: "var(--kami-text-muted)" }}>
            Find an experiment
          </label>
          <input
            id="toys-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or type (e.g. audio, WebGL, physics)"
            className="w-full px-4 py-3 text-sm focus:outline-none"
            style={{
              color: "var(--kami-text)",
              background: "var(--kami-input-bg)",
              border: "var(--kami-input-border)",
              borderRadius: "var(--kami-input-radius)",
              caretColor: "var(--kami-caret)",
            }}
          />
        </div>

        {filtered !== null ? (
          <section className="mb-10">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold" style={{ color: "var(--kami-text)" }}>
                Results
              </h2>
              <p className="text-xs" style={{ color: "var(--kami-text-dim)" }}>
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </p>
            </div>
            {filtered.length === 0 ? (
              <div
                className="px-5 py-8 text-sm"
                style={{
                  background: "var(--kami-surface-solid)",
                  border: "1px dashed var(--kami-border-strong)",
                  borderRadius: "var(--kami-card-radius)",
                  color: "var(--kami-text-muted)",
                }}
              >
                No experiments match your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {filtered.map((app) => (
                  <AppCard
                    key={app.href}
                    title={app.title}
                    badge={app.badge}
                    description={app.description}
                    href={app.href}
                    external={(app as { external?: boolean }).external}
                    ctaLabel="Play"
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mb-10">
              <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--kami-text)" }}>
                {group.label} <span className="font-normal" style={{ color: "var(--kami-text-dim)" }}>{group.apps.length}</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {group.apps.map((app) => (
                  <AppCard
                    key={app.href}
                    title={app.title}
                    badge={app.badge}
                    description={app.description}
                    href={app.href}
                    external={(app as { external?: boolean }).external}
                    ctaLabel="Play"
                  />
                ))}
              </div>
            </section>
          ))
        )}

        <Footer />
      </div>
    </div>
  );
}

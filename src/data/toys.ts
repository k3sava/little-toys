// Single source of truth for the toys hub. Imported by hub-content.tsx,
// sitemap.ts, and the prebuild AEO script.

export interface Toy {
  title: string;
  badge: string;
  description: string;
  href: string; // canonical URL (external or iamkesava.com path)
  external?: boolean;
}

export interface ToyGroup {
  label: string;
  apps: Toy[];
}

export const groups: ToyGroup[] = [
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
      { title: "Aurea", badge: "math art", description: "Fibonacci-driven parametric line art. 6 original forms, 4K rendering, video recording. Thousands of lines from pure equations, biology from math.", href: "https://k3sava.github.io/aurea/", external: true },
    ],
  },
  {
    label: "Craft",
    apps: [
      { title: "Zen Garden", badge: "CSS art", description: "Ink & Void, a CSS Zen Garden submission. 1800+ lines of pure CSS: scroll-driven animations, oklch color, @property, subgrid. Zero images, zero JS.", href: "https://apps.iamkesava.com/playground/zen-garden", external: true },
    ],
  },
];

export const allToys = groups.flatMap((g) => g.apps);

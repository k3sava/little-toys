# little toys

Creative experiments that run in your browser. Music, visuals, physics, generative art. No accounts, no tracking, nothing uploads. Everything runs client-side.

Live at **[toys.iamkesava.com](https://toys.iamkesava.com)**.

## What's inside

- **Audio** — sonicc (DAW-lite), plink (pentatonic plinko), synth-pad (XY pad)
- **Visual** — kaleidoscopic (WebGL fold), aurora (cursor light), string-art (modular geometry)
- **Generative** — and a few more, indexed on the hub

Each toy has a canonical URL at `toys.iamkesava.com/<slug>/` and its own GitHub repo for code-share. The hub aggregates each toy's `index.html` into this domain at build time so authority concentrates here.

## Stack

- Next.js 14 with `output: 'export'` (fully static)
- Tailwind CSS with a custom multi-theme system (paper, brutalist, terminal, zen, editorial)
- Deployed to GitHub Pages via GitHub Actions

## Local dev

```
npm install
npm run dev
```

## Build static bundle

```
npm run build
# → out/
```

## License

MIT. Each individual toy carries its own license — check the source repo linked from its hub page.

## Credits

By [Kesava](https://iamkesava.com). Part of the [apps.iamkesava.com](https://apps.iamkesava.com) family of small web things.

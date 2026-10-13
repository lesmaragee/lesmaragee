# TestExcel — 3D Hero

Premium interactive 3D hero for TestExcel (Payments QA, Scheme Compliance,
Test Automation, Release Assurance). Built with React 18 + TypeScript + Vite,
Tailwind CSS, Framer Motion, and React Three Fiber.

Adapted from a generic DeFi 3D-hero spec to TestExcel's monochrome brand:
strictly black / white / grey, no accent colour. The floating Bitcoin coin is
replaced by a procedurally-built metallic **payment card** (EMV chip,
contactless bars, embossed number line).

## Run

```bash
npm install
npm run dev      # local dev server (http://localhost:5173)
npm run build    # production build to /dist
npm run preview  # preview the production build
```

## Structure

```
src/
  App.tsx
  main.tsx
  index.css
  components/
    Navbar.tsx          # liquid-glass fixed nav, mobile menu
    Hero.tsx            # layered hero + scroll indicator
    HeroContent.tsx     # staggered headline / copy / CTAs
    3d/
      ThreeScene.tsx        # Canvas, monochrome lighting, vignette
      PaymentCard.tsx       # metallic card (replaces the coin)
      FloatingParticles.tsx # 200 instanced emissive shards
      WireframeTerrain.tsx  # infinite-scroll grid floor
```

## Brand tokens (tailwind.config.js)

- `ink` `#0a0a0a` · `surface` `#141414` · greys `#1c1c1c`–`#ececec` · `paper` `#f4f3f1`
- Fonts: Archivo (display), Inter (body), IBM Plex Mono (labels)

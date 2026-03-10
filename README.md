# 🐛 CENTIPEDE — Neon Arcade Edition

A fully-featured, browser-based Centipede arcade game built with Next.js 15, TypeScript, and HTML5 Canvas — styled in a glowing neon aesthetic.

---

## Features

- **Full Centipede gameplay** — zigzagging centipede, mushroom field, splitting on hit
- **All classic enemies** — Flea (drops mushrooms), Spider (bounces in player zone), Scorpion (poisons mushrooms)
- **Poisoned mushrooms** — scorpion-touched mushrooms send the centipede straight down
- **3 difficulty levels** — Easy / Medium / Hard with speed scaling
- **Difficulty progression** — each wave faster, more mushrooms, multi-chain centipede from level 2
- **Smooth 60fps rendering** — interpolated centipede animation, particle explosions, screen flash
- **Neon visual theme** — glowing sprites, shadowed canvas effects, scanline-free modern look
- **Web Audio API sounds** — synthesised retro bleeps, no external audio files
- **Optional background music** — procedural arpeggiated melody toggle
- **High score persistence** — saved to `localStorage`
- **Pause / Resume** — `P` key or HUD button
- **Mobile-first** — responsive canvas + on-screen D-pad and FIRE button
- **Keyboard + touch controls**
- **Vercel-ready** — zero extra configuration

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Rendering | HTML5 Canvas 2D |
| Styling | Tailwind CSS v3 |
| Audio | Web Audio API (synthesised) |
| Deploy | Vercel |

---

## Controls

### Desktop (Keyboard)

| Key | Action |
|-----|--------|
| `←` / `A` | Move left |
| `→` / `D` | Move right |
| `↑` / `W` | Move up (player zone) |
| `↓` / `S` | Move down (player zone) |
| `Space` / `Z` / `Ctrl` | Fire |
| `P` / `Esc` | Pause / Resume |

### Mobile (Touch)

- **D-pad** (bottom-left): ▲ ▼ ◄ ► directional buttons
- **FIRE** (bottom-right): large tap/hold button — auto-fires while held

---

## Scoring

| Target | Points |
|--------|--------|
| Centipede head | 100 |
| Centipede body | 10 |
| Flea | 200 |
| Spider (close) | 900 |
| Spider (medium) | 600 |
| Spider (far) | 300 |
| Scorpion | 1000 |
| Mushroom destroyed | 1 |

---

## How to Run Locally

### Prerequisites

- Node.js 18+ (or Bun / pnpm)

### Steps

```bash
git clone <repo-url>
cd centipede
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push to a GitHub repository
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Next.js — click **Deploy**

No environment variables required.

---

## Project Structure

```
centipede/
├── app/
│   ├── globals.css          # Tailwind + base styles
│   ├── layout.tsx           # Root layout, metadata, viewport
│   └── page.tsx             # Entry page
├── components/game/
│   ├── CentipedeGame.tsx    # Main game shell (canvas + overlays)
│   ├── HUD.tsx              # Score / lives / controls bar
│   ├── StartScreen.tsx      # Start / difficulty selection overlay
│   ├── GameOverScreen.tsx   # Game-over overlay
│   ├── PauseScreen.tsx      # Pause overlay
│   ├── LevelCompleteScreen.tsx
│   └── MobileControls.tsx   # Touch D-pad + Fire button
├── hooks/
│   ├── useGameEngine.ts     # RAF loop, canvas sizing, state bridge
│   ├── useControls.ts       # Keyboard & mobile input
│   └── useSound.ts          # Web Audio API synthesis
├── utils/
│   ├── gameTypes.ts         # TypeScript interfaces
│   ├── constants.ts         # Grid, speeds, colours, scoring
│   ├── gameLogic.ts         # Pure game-update functions
│   └── draw.ts              # Canvas drawing utilities
└── public/
    └── favicon.svg          # Neon centipede favicon
```

---

## License

MIT

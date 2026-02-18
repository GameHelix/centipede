# GazMonitor

Industrial gas distribution monitoring and prediction system — built as a proof of concept with a SCADA-style interface.

## Overview

GazMonitor is a fullstack Next.js application that provides real-time monitoring, demand prediction, and historical analytics for a natural gas distribution network. The UI is designed around industrial SCADA (Supervisory Control and Data Acquisition) conventions: dark theme, live gauges, animated pipeline diagrams, and status-coded alerts.

## Features

- **Dashboard** — Live network overview with animated pipeline diagram, circular gauges, 24h usage chart, and active alert feed
- **Prediction** — Physics-informed gas usage calculator with sliders for temperature, pressure, pipe geometry, and gas density
- **Analytics** — Historical flow analysis with period selector (24h / 7d / 30d / 90d), hourly bar chart, and hour × day heatmap
- **Monitor** — Station-by-station grid with status filtering, live metrics, and event log

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Framework   | Next.js 14 (App Router)       |
| Language    | TypeScript                    |
| Styling     | Tailwind CSS (custom theme)   |
| Charts      | Recharts                      |
| Icons       | Lucide React                  |
| Deployment  | Vercel                        |

No database — all data is generated server-side from a physics-based model, making the app fully stateless and instantly deployable.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├── page.tsx                # Dashboard
├── predict/page.tsx        # Prediction tool
├── analytics/page.tsx      # Analytics
├── monitor/page.tsx        # Station monitor
└── api/
    ├── predict/route.ts    # POST /api/predict
    ├── metrics/route.ts    # GET  /api/metrics
    └── history/route.ts    # GET  /api/history?period=24h|7d|30d|90d

components/
├── layout/                 # Sidebar, Header
├── gauges/                 # Canvas circular gauge
├── charts/                 # Area chart (Recharts)
├── scada/                  # Animated SVG pipeline diagram
└── ui/                     # MetricCard, StationCard

lib/
├── prediction.ts           # Physics-based prediction algorithm
└── data-generator.ts       # Deterministic data generation
```

## Prediction Model

The prediction engine (`lib/prediction.ts`) uses a physics-informed formula derived from historical gas consumption analysis:

```
volume = base × temporal × weekend × seasonal × temperature × pressure × pipe × density
```

Key factors:
- **Temporal** — twin-peak load curve (08:00 and 19:00)
- **Seasonal** — cosine envelope, peak January, trough July
- **Temperature** — heating demand ramps up below 15 °C
- **Pressure** — Bernoulli square-root relationship
- **Pipe inner diameter** — primary infrastructure factor (correlation +0.787)

## API Reference

### `POST /api/predict`

```json
{
  "timestamp":    "2025-01-15T18:00:00",
  "temperature":  8.4,
  "pressure":     455,
  "pressureDiff": 12.1,
  "density":      0.728,
  "dMm":          184,
  "dOutMm":       301
}
```

Returns predicted flow rate, daily estimate, confidence score, season, and factor breakdown.

### `GET /api/metrics`

Returns current network-wide metrics, all station statuses, and active alerts.

### `GET /api/history?period=24h`

Returns time-series data points, aggregate stats (min/max/avg/total), and a 7×24 demand heatmap. Supported periods: `24h`, `7d`, `30d`, `90d`.

## Deploy to Vercel

```bash
# Using Vercel CLI
npx vercel

# Or connect via dashboard
# vercel.com → New Project → Import Git Repository
```

The `vercel.json` configuration is included. No environment variables required.

## Design System

| Token              | Value     | Usage                        |
|--------------------|-----------|------------------------------|
| `scada-bg`         | `#040c18` | Main background              |
| `scada-panel`      | `#081525` | Card / panel background      |
| `scada-border`     | `#1a3352` | Default border               |
| `scada-cyan`       | `#00d4ff` | Primary accent, active state |
| `scada-green`      | `#00e676` | Normal / success status      |
| `scada-amber`      | `#ffab00` | Warning status               |
| `scada-red`        | `#ff1744` | Alert / critical status      |

## License

MIT

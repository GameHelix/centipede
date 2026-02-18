export interface DataPoint {
  timestamp:   string
  volume:      number
  pressure:    number
  temperature: number
  pressureDiff:number
}

export interface StationStatus {
  id:          string
  name:        string
  location:    string
  status:      'normal' | 'warning' | 'alert' | 'offline'
  currentFlow: number
  pressure:    number
  temperature: number
  efficiency:  number
  lastUpdated: string
}

export interface Alert {
  id:           string
  severity:     'info' | 'warning' | 'critical'
  message:      string
  station:      string
  timestamp:    string
  acknowledged: boolean
}

// Seeded LCG pseudo-random
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

export function generateDataPoints(
  periodHours: number,
  intervalHours = 1,
  now = new Date()
): DataPoint[] {
  const points: DataPoint[] = []
  const total  = Math.floor(periodHours / intervalHours)
  const rand   = lcg(periodHours * 97 + 31)

  for (let i = total; i >= 0; i--) {
    const ts     = new Date(now.getTime() - i * intervalHours * 3600_000)
    const hour   = ts.getHours()
    const month  = ts.getMonth()
    const dow    = ts.getDay()

    // Hourly twin-peak load curve
    const mp = Math.exp(-0.5 * Math.pow((hour - 8)  / 2.5, 2))
    const ep = Math.exp(-0.5 * Math.pow((hour - 19) / 2.5, 2))
    const hf = 0.72 + 0.45 * (0.6 * mp + 0.4 * ep)

    const wf  = (dow === 0 || dow === 6) ? 0.82 : 1.0
    const sf  = 1.0 + 0.55 * Math.cos(2 * Math.PI * (month + 0.5) / 12)
    const yf  = ts.getFullYear() === 2020 ? 0.87 : 1.0   // COVID dip
    const gf  = 1 + 0.01 * (ts.getFullYear() - 2018)     // 1 %/yr growth
    const nz  = 0.91 + rand() * 0.18

    const baseTemp  = 14 - 12 * Math.cos(2 * Math.PI * (month + 0.5) / 12)
    const dailyTemp = 5  * Math.sin(2 * Math.PI * (hour - 14) / 24)
    const temperature = baseTemp + dailyTemp + (rand() - 0.5) * 2

    const tempEff  = temperature <= 15
      ? 1.0 + (15 - temperature) * 0.028
      : 1.0 - (temperature - 15) * 0.010

    const pressure     = 440 + 30 * Math.sin(2 * Math.PI * (month / 12)) + (rand() - 0.5) * 20
    const pressureDiff = 11.2 + 1.8 * sf + (rand() - 0.5) * 2.5

    const volume = Math.max(0.1,
      24.643 * hf * wf * sf * tempEff * yf * gf * nz
    )

    points.push({
      timestamp:    ts.toISOString(),
      volume:       Math.round(volume      * 10)  / 10,
      pressure:     Math.round(pressure)         ,
      temperature:  Math.round(temperature * 10)  / 10,
      pressureDiff: Math.round(pressureDiff * 10) / 10,
    })
  }

  return points
}

export function generateStations(now = new Date()): StationStatus[] {
  const configs = [
    { id: 'alpha',   name: 'Alpha',   location: 'Baku Central',  basePressure: 460, baseDmm: 184, statusOverride: 'normal'  },
    { id: 'beta',    name: 'Beta',    location: 'Sabunchu',      basePressure: 445, baseDmm: 160, statusOverride: 'warning' },
    { id: 'gamma',   name: 'Gamma',   location: 'Surakhani',     basePressure: 435, baseDmm: 200, statusOverride: 'normal'  },
    { id: 'delta',   name: 'Delta',   location: 'Binagadi',      basePressure: 420, baseDmm: 142, statusOverride: 'alert'   },
    { id: 'epsilon', name: 'Epsilon', location: 'Sabail',        basePressure: 450, baseDmm: 175, statusOverride: 'normal'  },
    { id: 'zeta',    name: 'Zeta',    location: 'Nasimi',        basePressure: 455, baseDmm: 190, statusOverride: 'normal'  },
    { id: 'eta',     name: 'Eta',     location: 'Xazar',         basePressure: 430, baseDmm: 155, statusOverride: 'normal'  },
    { id: 'theta',   name: 'Theta',   location: 'Pirallahi',     basePressure: 415, baseDmm: 130, statusOverride: 'offline' },
  ]

  const hour  = now.getHours()
  const month = now.getMonth()

  const mp = Math.exp(-0.5 * Math.pow((hour - 8)  / 2.5, 2))
  const ep = Math.exp(-0.5 * Math.pow((hour - 19) / 2.5, 2))
  const hf = 0.72 + 0.45 * (0.6 * mp + 0.4 * ep)
  const sf = 1.0  + 0.55 * Math.cos(2 * Math.PI * (month + 0.5) / 12)

  return configs.map(({ id, name, location, basePressure, baseDmm, statusOverride }, idx) => {
    const rand   = lcg(idx * 137 + now.getMinutes())
    const jitter = 0.92 + rand() * 0.16
    const pipeF  = Math.pow(baseDmm / 184.11, 0.787)
    const flow   = Math.round(24.643 * hf * sf * pipeF * jitter * 10) / 10

    const pressure    = Math.round((basePressure + (rand() - 0.5) * 12) * 10) / 10
    const temperature = Math.round((14 - 12 * Math.cos(2 * Math.PI * (month + 0.5) / 12) + (rand() - 0.5) * 4) * 10) / 10
    const efficiency  = Math.round((82 + rand() * 16) * 10) / 10

    const secsAgo  = Math.floor(rand() * 120)
    const lastUpd  = new Date(now.getTime() - secsAgo * 1000).toISOString()

    return {
      id,
      name:        `Station ${name}`,
      location,
      status:      statusOverride as StationStatus['status'],
      currentFlow: statusOverride === 'offline' ? 0 : flow,
      pressure:    statusOverride === 'offline' ? 0 : pressure,
      temperature,
      efficiency:  statusOverride === 'offline' ? 0 : efficiency,
      lastUpdated: lastUpd,
    }
  })
}

export function generateAlerts(now = new Date()): Alert[] {
  return [
    {
      id:           'a1',
      severity:     'critical',
      message:      'Station Delta: pressure below threshold (412 kPa < 420 kPa)',
      station:      'Delta',
      timestamp:    new Date(now.getTime() - 4  * 60_000).toISOString(),
      acknowledged: false,
    },
    {
      id:           'a2',
      severity:     'warning',
      message:      'Station Beta: flow rate variance +18% above 7-day average',
      station:      'Beta',
      timestamp:    new Date(now.getTime() - 17 * 60_000).toISOString(),
      acknowledged: false,
    },
    {
      id:           'a3',
      severity:     'warning',
      message:      'Station Theta: communication link lost — maintenance dispatched',
      station:      'Theta',
      timestamp:    new Date(now.getTime() - 42 * 60_000).toISOString(),
      acknowledged: true,
    },
    {
      id:           'a4',
      severity:     'info',
      message:      'Network peak demand forecast: 94% capacity at 19:00',
      station:      'Network',
      timestamp:    new Date(now.getTime() - 90 * 60_000).toISOString(),
      acknowledged: true,
    },
  ]
}

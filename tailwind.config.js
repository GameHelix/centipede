/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        scada: {
          bg:       '#040c18',
          panel:    '#081525',
          panelAlt: '#0d1e35',
          border:   '#1a3352',
          cyan:     '#00d4ff',
          cyanDim:  '#0099bb',
          green:    '#00e676',
          greenDim: '#00a550',
          amber:    '#ffab00',
          red:      '#ff1744',
          text:     '#c8e0f0',
          textDim:  '#4a7090',
          textMuted:'#2a4a65',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-h':     'flowH 1.6s linear infinite',
        'flow-v':     'flowV 1.6s linear infinite',
        'glow-cyan':  'glowCyan 2s ease-in-out infinite alternate',
        'glow-green': 'glowGreen 2s ease-in-out infinite alternate',
        'glow-red':   'glowRed 1s ease-in-out infinite alternate',
        'spin-slow':  'spin 8s linear infinite',
        'fade-in':    'fadeIn 0.4s ease-in',
      },
      keyframes: {
        flowH: {
          '0%':   { 'stroke-dashoffset': '20' },
          '100%': { 'stroke-dashoffset': '0' },
        },
        flowV: {
          '0%':   { 'stroke-dashoffset': '20' },
          '100%': { 'stroke-dashoffset': '0' },
        },
        glowCyan: {
          '0%':   { boxShadow: '0 0 4px #00d4ff30' },
          '100%': { boxShadow: '0 0 16px #00d4ff70, 0 0 32px #00d4ff30' },
        },
        glowGreen: {
          '0%':   { boxShadow: '0 0 4px #00e67630' },
          '100%': { boxShadow: '0 0 16px #00e67670, 0 0 32px #00e67630' },
        },
        glowRed: {
          '0%':   { boxShadow: '0 0 4px #ff174430' },
          '100%': { boxShadow: '0 0 16px #ff174470, 0 0 32px #ff174430' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'grid-scada': `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid-scada': '40px 40px',
      },
      boxShadow: {
        'scada-card': '0 0 0 1px #1a3352, 0 4px 24px rgba(0,0,0,0.4)',
        'scada-glow': '0 0 20px rgba(0,212,255,0.15)',
        'inner-dark': 'inset 0 2px 8px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}

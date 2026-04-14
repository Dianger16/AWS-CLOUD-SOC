/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'Courier New', 'monospace'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // SOC terminal palette
        bg: {
          primary: '#0a0c0f',
          secondary: '#0f1318',
          card: '#131820',
          elevated: '#1a2030',
          border: '#1e2a3a',
        },
        cyan: {
          glow: '#00d4ff',
          bright: '#00b8e6',
          dim: '#0088aa',
          muted: '#004466',
        },
        severity: {
          critical: '#ff2d55',
          high: '#ff6b35',
          medium: '#ffd60a',
          low: '#34c759',
          info: '#636e7b',
        },
        text: {
          primary: '#e8eef5',
          secondary: '#8899aa',
          muted: '#445566',
          accent: '#00d4ff',
        },
      },
      backgroundImage: {
        'scan-lines': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px)',
        'grid-pattern': 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(0,212,255,0.15), 0 0 40px rgba(0,212,255,0.05)',
        'cyan-glow-sm': '0 0 10px rgba(0,212,255,0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'critical': '0 0 12px rgba(255,45,85,0.3)',
        'high': '0 0 12px rgba(255,107,53,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 3s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

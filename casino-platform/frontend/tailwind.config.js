/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        casino: {
          bg: '#0a0a0f',
          surface: '#12121a',
          card: '#1a1a26',
          border: '#2a2a3d',
          gold: '#f0c040',
          'gold-dim': '#a07820',
          green: '#00e87a',
          red: '#ff4060',
          purple: '#9060ff',
          blue: '#40a0ff',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-gold': 'pulseGold 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.68,-0.55,0.265,1.55)',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px #f0c040' },
          '50%': { opacity: '0.7', boxShadow: '0 0 25px #f0c040, 0 0 50px #f0c04044' },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        bounceIn: {
          from: { transform: 'scale(0.8)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

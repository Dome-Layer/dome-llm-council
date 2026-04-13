import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Full accent ramp (used internally)
        accent: {
          50:  '#E8F3FF',
          100: '#C5DFFF',
          200: '#99CCFF',
          300: '#66B3FF',
          400: '#40A8FF',
          500: '#0080FF',
          600: '#0066CC',
          700: '#004D99',
          800: '#003366',
          900: '#001A33',
        },
        // dome-* utilities — matches Process Analyzer + Data Intelligence tokens
        // These are light-theme values; dark overrides are handled via CSS vars in globals.css
        'dome-bg':             '#FFFFFF',
        'dome-surface':        '#FAFAFA',
        'dome-elevated':       '#F5F5F5',
        'dome-text':           '#0A0A0A',
        'dome-muted':          '#525252',
        'dome-tertiary':       '#A3A3A3',
        'dome-border-subtle':  '#F0F0F0',
        'dome-border':         '#E8E8E8',
        'dome-border-strong':  '#D4D4D4',
        'dome-border-accent':  '#99CCFF',
        'dome-accent':         '#0080FF',
        'dome-accent-hover':   '#40A8FF',
        'dome-accent-active':  '#0066CC',
        'dome-accent-subtle':  '#E8F3FF',
        'dome-success':        '#16A34A',
        'dome-success-subtle': '#F0FDF4',
        'dome-success-border': '#86EFAC',
        'dome-warning':        '#D97706',
        'dome-warning-subtle': '#FFFBEB',
        'dome-warning-border': '#FCD34D',
        'dome-error':          '#DC2626',
        'dome-error-subtle':   '#FEF2F2',
        'dome-error-border':   '#FCA5A5',
      },
      fontFamily: {
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'SF Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        full: '9999px',
      },
      maxWidth: {
        content:  '1200px',
        narrow:   '720px',
        wide:     '1400px',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        barGrow: {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--bar-width)' },
        },
      },
      animation: {
        shimmer:  'shimmer 1.5s infinite linear',
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.25s ease forwards',
        spin:     'spin 600ms linear infinite',
        'bar-grow': 'barGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}

export default config

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn/ui colors (keep existing)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Redesign Design Tokens - Background Colors
        // Use as: bg-bg-main, bg-bg-menu-bar, etc.
        'bg-main': 'var(--bg-main)',
        'bg-menu-bar': 'var(--bg-menu-bar)',
        'bg-card': 'var(--bg-card)',
        'bg-card-alt': 'var(--bg-card-alt)',
        'bg-profile': 'var(--bg-profile)',
        'bg-info-menu': 'var(--bg-info-menu)',
        'bg-gray-800': 'var(--bg-gray-800)',
        'bg-gray-700': 'var(--bg-gray-700)',
        'bg-unlinked-skills-pill': 'var(--bg-unlinked-skills-pill)',
        // Redesign Design Tokens - Text Colors
        // Use as: text-text-headings, text-text-body, etc.
        'text-headings': 'var(--text-headings)',
        'text-body': 'var(--text-body)',
        'text-secondary': 'var(--text-secondary)',
        'text-metadata': 'var(--text-metadata)',
        'text-on-dark': 'var(--text-on-dark)',
        'text-on-dark-secondary': 'var(--text-on-dark-secondary)',
        'text-on-dark-inactive': 'var(--text-on-dark-inactive)',
        'text-on-dark-hover': 'var(--text-on-dark-hover)',
        'text-white': 'var(--text-white)',
        'text-primary': 'var(--text-primary)',
        'text-gray-400': 'var(--text-gray-400)',
        'text-gray-500': 'var(--text-gray-500)',
        // Redesign Design Tokens - Accent Colors (Burgundy Family)
        // Use as: bg-accent-light, text-accent-light, border-accent-light, etc.
        'accent-light': 'var(--accent-light)', // Primary burgundy accent
        'accent-dark': 'var(--accent-dark)', // Darker burgundy for selected states
        'accent-emerald-300': 'var(--accent-emerald-300)', // Hover states
        // Consolidated aliases (all point to accent-light)
        'accent-emerald-400': 'var(--accent-emerald-400)',
        'accent-emerald-700': 'var(--accent-emerald-700)',
        'accent-purple-600': 'var(--accent-purple-600)',
        'accent-blue': 'var(--accent-blue)',
        // Redesign Design Tokens - Border Colors
        // Use as: border-border-gray-800, border-border-card, etc.
        'border-gray-800': 'var(--border-gray-800)',
        'border-gray-700': 'var(--border-gray-700)',
        'border-card': 'var(--border-card)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        ui: ['var(--font-ui)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      },
      spacing: {
        '18': '4.5rem',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
export default config;


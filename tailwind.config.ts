import type {Config} from 'tailwindcss'

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#3b82f6',
                    light: '#60a5fa',
                    dark: '#2563eb',
                },
            },
            backgroundColor: {
                'dark-bg': '#1e293b',
                'dark-card': '#2d3748',
            },
            borderColor: {
                'dark-border': '#374151',
            },
            textColor: {
                'dark-primary': '#f8fafc',
                'dark-secondary': '#94a3b8',
            },
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
                mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': {opacity: '0', transform: 'translateY(4px)'},
                    '100%': {opacity: '1', transform: 'translateY(0)'},
                },
            },
        },
    },
    plugins: [],
} satisfies Config
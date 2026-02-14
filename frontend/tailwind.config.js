/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-dark': '#0A192F',
                'bg-darker': '#060F1F',
                'card-bg': '#112240',
                'card-bg-lighter': '#1A3258',
                'primary': '#7C3AED',
                'primary-light': '#9F67FF',
                'success': '#00F5A0',
                'success-dark': '#00C980',
                'danger': '#FF3B3B',
                'danger-dark': '#CC2E2E',
                'text-light': '#F3F4F6',
                'text-muted': '#8892B0',
            },
            fontFamily: {
                'heading': ['Orbitron', 'sans-serif'],
                'subheading': ['"Space Grotesk"', 'sans-serif'],
                'body': ['Inter', 'sans-serif'],
            },
            animation: {
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'text-glow': 'text-glow 2s ease-in-out infinite',
                'slide-in-up': 'slide-in-up 0.5s ease-out forwards',
                'overlay-fade-in': 'overlay-fade-in 0.4s ease-out forwards',
                'popup-scale-in': 'popup-scale-in 0.5s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'lightning': 'lightning 3s ease-in-out infinite',
                'gradient-shift': 'gradient-shift 8s ease infinite',
                'fade-in': 'fade-in 0.6s ease-out forwards',
                'scale-in': 'scale-in 0.4s ease-out forwards',
                'slide-in-left': 'slide-in-left 0.5s ease-out forwards',
                'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-glow': 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
                'hero-glow-green': 'radial-gradient(ellipse at center, rgba(0, 245, 160, 0.08) 0%, transparent 60%)',
            },
            boxShadow: {
                'glow-primary': '0 0 20px rgba(124, 58, 237, 0.5), 0 0 60px rgba(124, 58, 237, 0.2)',
                'glow-primary-lg': '0 0 30px rgba(124, 58, 237, 0.6), 0 0 80px rgba(124, 58, 237, 0.3)',
                'glow-success': '0 0 20px rgba(0, 245, 160, 0.4), 0 0 60px rgba(0, 245, 160, 0.2)',
                'glow-danger': '0 0 20px rgba(255, 59, 59, 0.4), 0 0 60px rgba(255, 59, 59, 0.2)',
            },
        },
    },
    plugins: [],
}

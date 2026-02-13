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
                'card-bg': '#112240',
                'primary': '#7C3AED',
                'success': '#00F5A0',
                'danger': '#FF3B3B',
                'text-light': '#F3F4F6',
            },
            fontFamily: {
                'heading': ['Orbitron', 'sans-serif'],
                'body': ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

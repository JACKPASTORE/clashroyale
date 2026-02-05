/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                clash: {
                    blue: '#3B73E6',
                    blueDark: '#2C5AB8',
                    red: '#E84141',
                    yellow: '#FCD34D',
                    yellowDark: '#F59E0B',
                    bg: '#1C2735',
                    panel: '#2A3C53',
                    panelBorder: '#1A2634',
                },
                rarity: {
                    common: '#3B73E6',
                    rare: '#F97316', // Orange
                    epic: '#A855F7', // Purple
                    legendary: '#F43F5E', // Simplified legendary color
                }
            },
            boxShadow: {
                '3d': '0px 6px 0px rgba(0,0,0,0.4), 0px 10px 10px rgba(0,0,0,0.2)',
                '3d-pressed': '0px 0px 0px rgba(0,0,0,0.4), inset 0px 4px 8px rgba(0,0,0,0.3)',
                'inner-glow': 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.1)',
                'card-depth': 'inset 0px 4px 10px rgba(0,0,0,0.5)',
            },
            fontFamily: {
                sans: ['"Supercell-Magic"', 'sans-serif'],
            },
            animation: {
                'bounce-short': 'bounce-short 0.3s ease-in-out',
                'pulse-slow': 'pulse-slow 3s infinite',
                'shine': 'shine 3s infinite',
            },
            keyframes: {
                'bounce-short': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                'pulse-slow': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.03)' },
                },
                'shine': {
                    '0%': { transform: 'translateX(-100%) skewX(-15deg)' },
                    '20%, 100%': { transform: 'translateX(200%) skewX(-15deg)' }
                }
            }
        },
    },
    plugins: [],
}

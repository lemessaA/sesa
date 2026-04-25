/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#4361ee",
                secondary: "#3f37c9",
                accent: "#7209b7",
                success: "#4cc9f0",
                warning: "#f72585",
                dark: "#0a0f1d",
                light: "#f8faff",
                'dark-bg': "#0a0e1a", // Rich blue-black
                'dark-card': "#151b2d", // Slightly lighter navy
                'dark-text': "#d1d5db",
            },
            boxShadow: {
                'premium': '0 4px 20px rgba(0, 0, 0, 0.1)',
                'premium-hover': '0 10px 30px rgba(0, 0, 0, 0.15)',
            },
            animation: {
                'pop': 'pop 0.5s ease-out forwards',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                pop: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '70%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}

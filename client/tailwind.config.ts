import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': ['Inter', 'sans-serif'],
			},
			colors: {
				border: "#a17a79",
				input: "#fce5e2",
				ring: "#329962",
				background: "#fce5e2",
				foreground: "#00422b",
				primary: {
					DEFAULT: "#329962",
					foreground: "#fce5e2",
				},
				secondary: {
					DEFAULT: "#fe6e35",
					foreground: "#00422b",
				},
				destructive: {
					DEFAULT: "#cd1d00",
					foreground: "#fce5e2",
				},
				muted: {
					DEFAULT: "#93d6b0",
					foreground: "#6d3727",
				},
				accent: {
					DEFAULT: "#fcbd77",
					foreground: "#00422b",
				},
				popover: {
					DEFAULT: "#fce5e2",
					foreground: "#00422b",
				},
				card: {
					DEFAULT: "#fce5e2",
					foreground: "#00422b",
				},
				sidebar: {
					DEFAULT: "#fce5e2",
					foreground: "#00422b",
					primary: "#329962",
					"primary-foreground": "#fce5e2",
					accent: "#fcbd77",
					"accent-foreground": "#00422b",
					border: "#a17a79",
					ring: "#329962",
				},
				dark: "#00422b",
				"muted-brown": "#6d3727",
				"soft-green": "#93d6b0",
				"muted-pink-brown": "#a17a79",
				"alert-error": "#cd1d00",
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-luxury': 'var(--gradient-luxury)',
				'gradient-subtle': 'var(--gradient-subtle)',
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)',
				'luxury': 'var(--shadow-luxury)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
} satisfies Config;

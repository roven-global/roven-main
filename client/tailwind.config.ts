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
				'serif': ['Merriweather', 'Source Serif Pro', 'Georgia', 'serif'],
				'playfair': ['Playfair Display', 'serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Botanical Color Palette
				sage: {
					DEFAULT: '#8B9D94',
					light: '#A3B1A8',
					dark: '#6B7A72'
				},
				forest: {
					DEFAULT: '#5C6B62',
					light: '#7A8A80',
					dark: '#4A5750'
				},
				'deep-forest': {
					DEFAULT: '#2C3E37',
					light: '#3D4F48',
					dark: '#1B2D26'
				},
				'warm-cream': {
					DEFAULT: '#F5F1EB',
					light: '#FAF8F5',
					dark: '#E8E0D6'
				},
				'soft-beige': {
					DEFAULT: '#E8E0D6',
					light: '#F0E9E0',
					dark: '#D4C8BC'
				},
				'warm-taupe': {
					DEFAULT: '#C8B5A0',
					light: '#D4C3B0',
					dark: '#B8A590'
				},
				'gold-accent': {
					DEFAULT: '#D4B896',
					light: '#E0C8A8',
					dark: '#C8A884'
				},
				'soft-bronze': {
					DEFAULT: '#A68B5B',
					light: '#B89A6F',
					dark: '#947A4F'
				}
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
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

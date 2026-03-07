import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
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
				nutrition: {
					'50': '#fff8f2',
					'100': '#ffe9d3',
					'200': '#ffceab',
					'300': '#ffad79',
					'400': '#ff8a43',
					'500': '#ff7a00',
					'600': '#ea6700',
					'700': '#c84e00',
					'800': '#a23e00',
					'900': '#833405',
					'950': '#461800'
				},
				nutri: {
					base: 'var(--nutri-base, #0B1120)',
					panel: 'var(--nutri-panel, #151F32)',
					lime: '#A3E635',
					peach: '#FB923C',
					mint: '#A7F3D0',
					brand: 'var(--nutri-brand, #FF7A00)'
				},
				orange: {
					'50': '#fff7ed',
					'100': '#ffedd5',
					'200': '#fed7aa',
					'300': '#fdba74',
					'400': '#fb923c',
					'500': '#f97316',
					'600': '#ea580c'
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: [
					'Inter',
					'system-ui',
					'sans-serif'
				],
				tech: [
					'Outfit',
					'system-ui',
					'sans-serif'
				]
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;

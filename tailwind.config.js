/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./app/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
        'wr-gold': 'hsl(var(--wr-gold))',
        'wr-blue': 'hsl(var(--wr-blue))',
        'wr-dark-button': 'hsl(var(--wr-dark-button))',
        'wr-neon-gold': 'hsl(var(--wr-neon-gold))',
        'wr-sunset-start': 'hsl(var(--wr-sunset-start))',
        'wr-sunset-end': 'hsl(var(--wr-sunset-end))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0px' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0px' },
				},
        'glow': {
          '0%, 100%': { boxShadow: '0 0 5px hsl(var(--primary))' },
          '50%': { boxShadow: '0 0 20px 5px hsl(var(--primary))' },
        },
        'pulsate-glow': {
          '0%': { boxShadow: '0 0 5px hsl(var(--wr-neon-gold)), 0 0 10px hsl(var(--wr-neon-gold)), 0 0 15px hsl(var(--wr-neon-gold)), 0 0 20px hsl(var(--wr-neon-gold))' },
          '100%': { boxShadow: '0 0 10px hsl(var(--wr-neon-gold)), 0 0 20px hsl(var(--wr-neon-gold)), 0 0 30px hsl(var(--wr-neon-gold)), 0 0 40px hsl(var(--wr-neon-gold))' },
        },
        'pulsate-glow-orange': {
          '0%': { boxShadow: '0 0 5px hsl(var(--wr-sunset-start)), 0 0 10px hsl(var(--wr-sunset-start)), 0 0 15px hsl(var(--wr-sunset-start)), 0 0 20px hsl(var(--wr-sunset-start))' },
          '100%': { boxShadow: '0 0 10px hsl(var(--wr-sunset-start)), 0 0 20px hsl(var(--wr-sunset-start)), 0 0 30px hsl(var(--wr-sunset-start)), 0 0 40px hsl(var(--wr-sunset-start))' },
        }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
        'button-glow': 'glow 2s ease-in-out infinite',
        'pulsate-glow': 'pulsate-glow 2s infinite alternate',
        'pulsate-glow-orange': 'pulsate-glow-orange 2s infinite alternate',
			},
      backgroundImage: {
  'figma-radial':
    'radial-gradient(circle at 50% 35%, #1C2486 0%, #111753 16%, #0C1039 38%, #090C2C 62%, #070920 95%)',
},

		},
	},
	plugins: [require('tailwindcss-animate')],
};
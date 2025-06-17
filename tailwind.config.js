/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
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
  			sans: [
  				'var(--font-sans)',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'var(--font-mono)',
  				'monospace'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				'50': 'hsl(221, 100%, 96%)',
  				'100': 'hsl(223, 95%, 90%)',
  				'200': 'hsl(223, 95%, 85%)',
  				'300': 'hsl(223, 90%, 75%)',
  				'400': 'hsl(223, 85%, 65%)',
  				'500': 'hsl(224, 83%, 57%)',
  				'600': 'hsl(225, 86%, 49%)',
  				'700': 'hsl(226, 88%, 42%)',
  				'800': 'hsl(228, 88%, 35%)',
  				'900': 'hsl(230, 88%, 25%)',
  				'950': 'hsl(232, 90%, 15%)',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': 'hsl(262, 100%, 97%)',
  				'100': 'hsl(260, 95%, 93%)',
  				'200': 'hsl(259, 95%, 89%)',
  				'300': 'hsl(258, 90%, 81%)',
  				'400': 'hsl(257, 85%, 73%)',
  				'500': 'hsl(256, 80%, 65%)',
  				'600': 'hsl(255, 75%, 58%)',
  				'700': 'hsl(254, 70%, 50%)',
  				'800': 'hsl(255, 70%, 40%)',
  				'900': 'hsl(257, 70%, 30%)',
  				'950': 'hsl(260, 70%, 20%)',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))',
  				light: 'hsl(142, 76%, 36%)',
  				dark: 'hsl(142, 64%, 54%)',
  				bg: 'hsl(142, 76%, 95%)'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))',
  				light: 'hsl(38, 92%, 40%)',
  				dark: 'hsl(38, 92%, 60%)',
  				bg: 'hsl(38, 92%, 95%)'
  			},
  			error: {
  				DEFAULT: 'hsl(0, 84%, 60%)',
  				light: 'hsl(0, 84%, 45%)',
  				dark: 'hsl(0, 84%, 70%)',
  				bg: 'hsl(0, 84%, 97%)'
  			},
  			info: {
  				DEFAULT: 'hsl(200, 85%, 60%)',
  				light: 'hsl(200, 85%, 45%)',
  				dark: 'hsl(200, 85%, 70%)',
  				bg: 'hsl(200, 85%, 95%)'
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
  			neutral: {
  				'50': 'hsl(220, 20%, 98%)',
  				'100': 'hsl(220, 15%, 95%)',
  				'200': 'hsl(220, 15%, 91%)',
  				'300': 'hsl(220, 10%, 85%)',
  				'400': 'hsl(220, 10%, 70%)',
  				'500': 'hsl(220, 10%, 50%)',
  				'600': 'hsl(220, 10%, 40%)',
  				'700': 'hsl(222, 15%, 30%)',
  				'800': 'hsl(224, 20%, 20%)',
  				'900': 'hsl(226, 25%, 15%)',
  				'950': 'hsl(228, 30%, 10%)'
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
  		boxShadow: {
  			sm: '0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
  			md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  			lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  			xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  			'2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  			inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  			none: 'none',
  			'dark-sm': '0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3)',
  			'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  			'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: 0
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
  					height: 0
  				}
  			},
  			'fade-in': {
  				from: {
  					opacity: 0
  				},
  				to: {
  					opacity: 1
  				}
  			},
  			'fade-out': {
  				from: {
  					opacity: 1
  				},
  				to: {
  					opacity: 0
  				}
  			},
  			'slide-in-right': {
  				from: {
  					transform: 'translateX(100%)'
  				},
  				to: {
  					transform: 'translateX(0)'
  				}
  			},
  			'slide-out-right': {
  				from: {
  					transform: 'translateX(0)'
  				},
  				to: {
  					transform: 'translateX(100%)'
  				}
  			},
  			'slide-in-left': {
  				from: {
  					transform: 'translateX(-100%)'
  				},
  				to: {
  					transform: 'translateX(0)'
  				}
  			},
  			'slide-out-left': {
  				from: {
  					transform: 'translateX(0)'
  				},
  				to: {
  					transform: 'translateX(-100%)'
  				}
  			},
  			'slide-in-bottom': {
  				from: {
  					transform: 'translateY(100%)'
  				},
  				to: {
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-out-bottom': {
  				from: {
  					transform: 'translateY(0)'
  				},
  				to: {
  					transform: 'translateY(100%)'
  				}
  			},
  			'pulse': {
  				'0%, 100%': {
  					opacity: 1
  				},
  				'50%': {
  					opacity: 0.5
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.2s ease-out',
  			'fade-out': 'fade-out 0.2s ease-out',
  			'slide-in-right': 'slide-in-right 0.2s ease-out',
  			'slide-out-right': 'slide-out-right 0.2s ease-out',
  			'slide-in-left': 'slide-in-left 0.2s ease-out',
  			'slide-out-left': 'slide-out-left 0.2s ease-out',
  			'slide-in-bottom': 'slide-in-bottom 0.2s ease-out',
  			'slide-out-bottom': 'slide-out-bottom 0.2s ease-out',
  			'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  		},
  		transitionDuration: {
  			'0': '0ms',
  			'2000': '2000ms'
  		},
  		height: {
  			'screen-1/2': '50vh',
  			'screen-1/3': '33.333333vh',
  			'screen-2/3': '66.666667vh',
  			'screen-1/4': '25vh',
  			'screen-3/4': '75vh'
  		},
  		maxHeight: {
  			'0': '0',
  			'screen-1/2': '50vh',
  			'screen-1/3': '33.333333vh',
  			'screen-2/3': '66.666667vh',
  			'screen-1/4': '25vh',
  			'screen-3/4': '75vh'
  		},
  		typography: '(theme) => ({\n        DEFAULT: {\n          css: {\n            a: {\n              color: theme('colors.primary.500'),\n              '&:hover': {\n                color: theme('colors.primary.700'),\n              },\n            },\n            'code::before': {\n              content: '"',\n            },\n            'code::after': {\n              content: '"',\n            },\n          },\n        },\n      })'
  	}
  },
  plugins: [require("tailwindcss-animate")],
} 
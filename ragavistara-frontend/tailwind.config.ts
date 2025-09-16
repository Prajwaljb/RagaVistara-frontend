import type { Config } from 'tailwindcss'

function withOpacity(variable: string) {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue === undefined) {
      return `var(${variable})`
    }
    return `rgba(var(${variable}), ${opacityValue})`
  }
}

const config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cast to unknown then string to bypass TS error
        brand: withOpacity('--brand') as unknown as string,
        success: '#22c55e',
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config

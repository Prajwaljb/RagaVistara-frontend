import { useEffect } from 'react'
import { useTheme } from '@/store/useTheme'

export default function ThemeToggle() {
  const theme = useTheme((s) => s.theme)
  const toggle = useTheme((s) => s.toggle)

  useEffect(() => {
    // Ensure theme applied on initial mount
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  return (
    <button
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={toggle}
      className="rounded-full border border-gray-300 dark:border-white/10 px-3 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
    >
      {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
    </button>
  )
}



import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggle: () => void
  set: (t: Theme) => void
}

const storageKey = 'rv-theme'

function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem(storageKey) as Theme) || 'dark',
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(storageKey, next)
    applyTheme(next)
    set({ theme: next })
  },
  set: (t) => {
    localStorage.setItem(storageKey, t)
    applyTheme(t)
    set({ theme: t })
  },
}))



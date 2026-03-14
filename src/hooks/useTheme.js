import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('dos-theme') || 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('dos-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return { theme, toggleTheme }
}
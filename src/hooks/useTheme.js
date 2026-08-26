import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'fused-theme-preference'

function getSystemPrefersDark() {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
}

export function useTheme() {
  const [preference, setPreference] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system'
    } catch {
      return 'system'
    }
  })
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setSystemPrefersDark(media.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      // localStorage unavailable — theme just won't persist across reloads
    }
  }, [preference])

  const isDark = preference === 'dark' || (preference === 'system' && systemPrefersDark)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = useCallback(() => {
    setPreference((current) => {
      const currentIsDark = current === 'dark' || (current === 'system' && getSystemPrefersDark())
      return currentIsDark ? 'light' : 'dark'
    })
  }, [])

  return { preference, isDark, setPreference, toggleTheme }
}

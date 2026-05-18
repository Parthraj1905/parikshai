import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('fontSize') || '16')
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
    localStorage.setItem('fontSize', fontSize.toString())
  }, [fontSize])

  function toggleTheme() {
    setDarkMode(prev => !prev)
  }

  function increaseFontSize() {
    setFontSize(prev => Math.min(prev + 2, 22))
  }

  function decreaseFontSize() {
    setFontSize(prev => Math.max(prev - 2, 12))
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, fontSize, increaseFontSize, decreaseFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
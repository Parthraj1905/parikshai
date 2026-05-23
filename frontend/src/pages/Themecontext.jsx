import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('fontSize') || '16'))

  useEffect(() => {
    // Always dark mode (Gemini style)
    document.documentElement.classList.add('dark')
    document.documentElement.style.fontSize = `${fontSize}px`
    localStorage.setItem('fontSize', fontSize.toString())
  }, [fontSize])

  // Stub darkMode as always true
  const darkMode = true
  const toggleTheme = () => {}
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 22))
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12))

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

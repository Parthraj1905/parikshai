import { useTheme } from '../lib/ThemeContext'
import { useToast } from '../lib/ToastContext'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { darkMode, toggleTheme, fontSize, increaseFontSize, decreaseFontSize } = useTheme()
  const toast = useToast()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-gray-900 dark:text-gray-100 font-bold text-lg">Settings</h2>
          <p className="text-gray-400 text-xs">Customize your experience</p>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-gray-900 dark:text-gray-100 font-bold text-sm mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            Appearance
          </h3>
          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                <p className="text-xs text-gray-400">Toggle dark/light theme</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  darkMode ? 'bg-orange-600' : 'bg-gray-200'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 flex items-center justify-center ${
                  darkMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}>
                  <span className="text-[10px]">{darkMode ? '🌙' : '☀️'}</span>
                </div>
              </button>
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Font Size</p>
                <p className="text-xs text-gray-400">Adjust text size ({fontSize}px)</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSize <= 12}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-all flex items-center justify-center text-sm font-bold"
                >
                  A−
                </button>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-center">{fontSize}</span>
                <button
                  onClick={increaseFontSize}
                  disabled={fontSize >= 22}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-all flex items-center justify-center text-sm font-bold"
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-gray-900 dark:text-gray-100 font-bold text-sm mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Account
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span className="text-sm font-medium">Sign Out</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-gray-900 dark:text-gray-100 font-bold text-sm mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            About
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Version</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platform</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">Web</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Powered by</span>
              <span className="text-orange-600 font-medium">Google Gemini AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
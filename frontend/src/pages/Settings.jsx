import { useTheme } from '../lib/ThemeContext'
import { useToast } from '../lib/ToastContext'
import { supabase } from '../lib/supabase'

const Row = ({ label, desc, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #3c3c3e' }}>
    <div>
      <p style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '500', margin: '0 0 2px' }}>{label}</p>
      {desc && <p style={{ color: '#9aa0a6', fontSize: '12px', margin: 0 }}>{desc}</p>}
    </div>
    {right}
  </div>
)

export default function Settings({ onRequestLogout }) {
  const { fontSize, increaseFontSize, decreaseFontSize } = useTheme()
  const toast = useToast()

  async function handleLogout() {
    if (onRequestLogout) {
      onRequestLogout()
    } else {
      if (window.confirm('Are you sure you want to sign out?')) {
        await supabase.auth.signOut()
        toast.success('Signed out')
      }
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#1e1f20', fontFamily: "'Google Sans', sans-serif" }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#e3e3e3', margin: '0 0 4px' }}>Settings</h2>
          <p style={{ fontSize: '13px', color: '#9aa0a6', margin: 0 }}>Customize your experience</p>
        </div>


        {/* About */}
        <div style={{ background: '#2a2b2d', borderRadius: '14px', padding: '20px', border: '1px solid #3c3c3e', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: '600', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>About</h3>
          {[
            ['Version', '1.0.0'],
            ['Platform', 'Web (PWA)'],
            ['AI Engine', 'Google Gemini'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #3c3c3e' }}>
              <span style={{ color: '#9aa0a6', fontSize: '14px' }}>{k}</span>
              <span style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '500' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Account */}
        <div style={{ background: '#2a2b2d', borderRadius: '14px', padding: '20px', border: '1px solid #3c3c3e' }}>
          <h3 style={{ fontSize: '11px', fontWeight: '600', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Account</h3>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '13px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

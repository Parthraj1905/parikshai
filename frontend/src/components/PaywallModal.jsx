import { useNavigate } from 'react-router-dom'

function SparkleIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="g1-modal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8"/>
          <stop offset="50%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#f472b6"/>
        </linearGradient>
      </defs>
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" fill="url(#g1-modal)"/>
    </svg>
  )
}

export default function PaywallModal({ isOpen, onClose }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Google Sans', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '420px', background: '#1e1f20', borderRadius: '16px', border: '1px solid #3c3c3e', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', animation: 'slideUp 0.3s ease' }}>
        
        <div style={{ background: 'linear-gradient(135deg, rgba(138,180,248,0.1) 0%, rgba(192,132,252,0.1) 100%)', padding: '32px 24px', textAlign: 'center', borderBottom: '1px solid rgba(138,180,248,0.2)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#131314', border: '1px solid #3c3c3e', marginBottom: '16px' }}>
            <SparkleIcon size={28} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#e3e3e3', margin: '0 0 8px' }}>Daily Limit Reached</h3>
          <p style={{ fontSize: '14px', color: '#9aa0a6', margin: 0, lineHeight: '1.5' }}>You've used up your free daily quota. Upgrade to ParikshAI Pro to keep learning without limits.</p>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>💬</span>
              <div>
                <p style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>100 AI Chat Questions/day</p>
                <p style={{ color: '#9aa0a6', fontSize: '12px', margin: 0 }}>vs 20/day on Free plan</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🎯</span>
              <div>
                <p style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>10 MCQ Generations/day (100 Qs)</p>
                <p style={{ color: '#9aa0a6', fontSize: '12px', margin: 0 }}>vs 1 generation/day on Free plan</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>💾</span>
              <div>
                <p style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>Saved Chats & Progress</p>
                <p style={{ color: '#9aa0a6', fontSize: '12px', margin: 0 }}>Never lose your preparation history</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { onClose(); navigate('/billing'); }}
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)', color: '#0d0d0f', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Upgrade to Pro — ₹99/month
          </button>
          <button
            onClick={onClose}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #3c3c3e', background: 'transparent', color: '#e3e3e3', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#2a2b2d'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}

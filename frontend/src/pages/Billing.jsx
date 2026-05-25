import { useEffect, useState } from 'react'
import { useToast } from '../lib/ToastContext'
import { createProSubscription, getPlan, verifyProSubscription } from '../lib/api'

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout.'))
    document.body.appendChild(script)
  })
}

function SparkleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" fill="url(#bg1)" />
    </svg>
  )
}

const PRO_FEATURES = [
  { icon: '💬', label: '100 AI chat questions/day', free: '20/day' },
  { icon: '🎯', label: '100 MCQ generations/day (1000 questions)', free: '1 generation/day (10 Qs)' },
  { icon: '💾', label: 'Unlimited saved chats', free: 'Not available' },
  { icon: '📊', label: 'Progress dashboard & weak topics', free: 'Not available' },
  { icon: '⚡', label: 'Priority AI responses', free: 'Standard' },
]

export default function Billing({ session }) {
  const toast = useToast()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [billingLoading, setBillingLoading] = useState(false)

  const userEmail = session?.user?.email || ''
  const userName = userEmail.split('@')[0] || 'User'
  const userInitial = userEmail?.[0]?.toUpperCase() || 'U'

  useEffect(() => {
    let active = true
    setLoading(true)
    getPlan()
      .then(data => { if (active) setPlan(data) })
      .catch(() => { if (active) setPlan(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function handleUpgrade() {
    setBillingLoading(true)
    try {
      await loadRazorpayScript()
      const subscription = await createProSubscription()
      const options = {
        key: subscription.key_id,
        subscription_id: subscription.subscription_id,
        name: subscription.name,
        description: subscription.description,
        prefill: subscription.prefill,
        theme: { color: '#8ab4f8' },
        handler: async (response) => {
          try {
            const updatedPlan = await verifyProSubscription(response)
            setPlan(updatedPlan)
            toast.success('🎉 Pro activated! Welcome to ParikshAI Pro.')
          } catch (error) {
            toast.error(error.response?.data?.detail || 'Payment verification failed')
          }
        },
      }
      const checkout = new window.Razorpay(options)
      checkout.on('payment.failed', response => {
        toast.error(response.error?.description || 'Payment failed')
      })
      checkout.open()
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Could not start payment')
    } finally {
      setBillingLoading(false)
    }
  }

  const isPro = plan?.plan === 'pro'
  const chatUsage = plan?.usage?.chat ?? 0
  const mcqUsage = plan?.usage?.mcq ?? 0
  const chatLimit = plan?.limits?.chat ?? 20
  const mcqLimit = plan?.limits?.mcq ?? 10

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#1e1f20', fontFamily: "'Google Sans', sans-serif" }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#e3e3e3', margin: '0 0 4px' }}>Billing & Plan</h2>
          <p style={{ fontSize: '13px', color: '#9aa0a6', margin: 0 }}>Manage your subscription and usage</p>
        </div>

        {/* Account card */}
        <div style={{ background: '#2a2b2d', borderRadius: '14px', padding: '20px', border: '1px solid #3c3c3e', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #8ab4f8, #c084fc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: '700', fontSize: '18px',
          }}>
            {userInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '600', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
            <p style={{ color: '#9aa0a6', fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</p>
          </div>
          <span style={{
            padding: '5px 12px', borderRadius: '8px', flexShrink: 0,
            background: isPro ? 'rgba(74,222,128,0.12)' : 'rgba(138,180,248,0.12)',
            color: isPro ? '#4ade80' : '#8ab4f8',
            fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em',
          }}>
            {loading ? '…' : isPro ? 'PRO' : 'FREE'}
          </span>
        </div>

        {/* Usage stats */}
        {plan && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            {[
              { label: 'Chat Questions', used: chatUsage, limit: chatLimit, color: '#8ab4f8' },
              { label: 'MCQ Generations', used: mcqUsage, limit: mcqLimit, color: '#c084fc' },
            ].map(({ label, used, limit, color }) => {
              const pct = Math.min(100, Math.round((used / limit) * 100))
              return (
                <div key={label} style={{ background: '#2a2b2d', borderRadius: '12px', padding: '16px', border: '1px solid #3c3c3e' }}>
                  <p style={{ color: '#9aa0a6', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{label}</p>
                  <p style={{ color: '#e3e3e3', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>
                    {used}<span style={{ color: '#5f6368', fontSize: '13px', fontWeight: '400' }}>/{limit}</span>
                  </p>
                  <div style={{ height: '3px', background: '#3c3c3e', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: color, borderRadius: '100px', width: `${pct}%`, transition: 'width 0.5s ease' }} />
                  </div>
                  <p style={{ color: '#5f6368', fontSize: '11px', margin: '6px 0 0' }}>Resets daily</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Current plan / upgrade */}
        {!isPro ? (
          <div style={{ background: 'linear-gradient(135deg, rgba(138,180,248,0.08) 0%, rgba(192,132,252,0.08) 100%)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(138,180,248,0.2)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <SparkleIcon size={22} />
              <div>
                <p style={{ color: '#e3e3e3', fontSize: '16px', fontWeight: '700', margin: '0 0 2px' }}>Upgrade to ParikshAI Pro</p>
                <p style={{ color: '#9aa0a6', fontSize: '13px', margin: 0 }}>Unlock everything for serious prep</p>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                <p style={{ color: '#8ab4f8', fontSize: '22px', fontWeight: '800', margin: '0 0 2px' }}>₹99</p>
                <p style={{ color: '#9aa0a6', fontSize: '11px', margin: 0 }}>/month</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {PRO_FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{f.icon}</span>
                    <span style={{ color: '#e3e3e3', fontSize: '13px', fontWeight: '500' }}>{f.label}</span>
                  </div>
                  <span style={{ color: '#5f6368', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#f87171', textDecoration: 'line-through', marginRight: '4px' }}>{f.free}</span>
                    <span style={{ color: '#4ade80', fontWeight: '600' }}>✓</span>
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={billingLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                background: billingLoading ? '#3c3c3e' : 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)',
                color: billingLoading ? '#9aa0a6' : '#0d0d0f',
                fontSize: '15px', fontWeight: '700',
                cursor: billingLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'opacity 0.15s',
              }}
            >
              {billingLoading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid #5f6368', borderTopColor: '#9aa0a6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Opening Razorpay...
                </>
              ) : (
                <><SparkleIcon size={18} /> Upgrade to Pro — ₹99/month</>
              )}
            </button>
            <p style={{ color: '#5f6368', fontSize: '11px', textAlign: 'center', marginTop: '10px' }}>
              Secure payment via Razorpay · Cancel anytime
            </p>
          </div>
        ) : (
          <div style={{ background: 'rgba(74,222,128,0.06)', borderRadius: '14px', padding: '20px', border: '1px solid rgba(74,222,128,0.2)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🏆</span>
              <div>
                <p style={{ color: '#4ade80', fontSize: '15px', fontWeight: '700', margin: '0 0 3px' }}>You're on ParikshAI Pro</p>
                <p style={{ color: '#9aa0a6', fontSize: '13px', margin: 0 }}>All features unlocked. Keep up the great prep!</p>
              </div>
            </div>
          </div>
        )}

        {/* Free plan feature comparison */}
        {!isPro && (
          <div style={{ background: '#2a2b2d', borderRadius: '14px', padding: '20px', border: '1px solid #3c3c3e' }}>
            <h3 style={{ color: '#9aa0a6', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Your current Free plan</h3>
            {[
              ['20 chat questions/day', true],
              ['1 MCQ generation/day (10 questions)', true],
              ['Saved chats', false],
              ['Progress dashboard', false],
              ['Weak topic tracking', false],
            ].map(([label, available]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #3c3c3e' }}>
                <span style={{ color: available ? '#4ade80' : '#5f6368', fontSize: '14px', flexShrink: 0 }}>{available ? '✓' : '✗'}</span>
                <span style={{ color: available ? '#e3e3e3' : '#5f6368', fontSize: '13px' }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

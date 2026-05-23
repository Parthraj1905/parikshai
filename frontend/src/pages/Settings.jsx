import { useEffect, useState } from 'react'
import { useTheme } from '../lib/ThemeContext'
import { useToast } from '../lib/ToastContext'
import { supabase } from '../lib/supabase'
import { createProSubscription, getPlan, verifyProSubscription } from '../lib/api'

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout.'))
    document.body.appendChild(script)
  })
}

export default function Settings() {
  const { fontSize, increaseFontSize, decreaseFontSize } = useTheme()
  const toast = useToast()
  const [plan, setPlan] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)

  async function refreshPlan() {
    try {
      setPlan(await getPlan())
    } catch {
      setPlan(null)
    }
  }

  useEffect(() => {
    refreshPlan()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
  }

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
            toast.success('Pro activated')
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

  const Row = ({ label, desc, right }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #3c3c3e' }}>
      <div>
        <p style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '500', margin: '0 0 2px' }}>{label}</p>
        {desc && <p style={{ color: '#9aa0a6', fontSize: '12px', margin: 0 }}>{desc}</p>}
      </div>
      {right}
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#1e1f20', fontFamily: "'Google Sans', sans-serif" }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#e3e3e3', margin: '0 0 4px' }}>Settings</h2>
          <p style={{ fontSize: '13px', color: '#9aa0a6', margin: 0 }}>Customize your experience</p>
        </div>

        {/* Appearance */}
        <div style={{ background: '#2a2b2d', borderRadius: '16px', padding: '24px', border: '1px solid #3c3c3e', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Billing</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <p style={{ color: '#e3e3e3', fontSize: '16px', fontWeight: '700', margin: '0 0 4px' }}>
                {plan?.plan === 'pro' ? 'ParikshAI Pro' : 'Free plan'}
              </p>
              <p style={{ color: '#9aa0a6', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                {plan?.plan === 'pro'
                  ? '100 chat questions/day, 100 MCQ generations/day, saved chats, and progress dashboard.'
                  : '20 chat questions/day and 10 MCQ generations/day. Upgrade for saved chats and progress.'}
              </p>
            </div>
            <span style={{
              padding: '5px 12px',
              borderRadius: '100px',
              background: plan?.plan === 'pro' ? 'rgba(74,222,128,0.12)' : 'rgba(138,180,248,0.12)',
              color: plan?.plan === 'pro' ? '#4ade80' : '#8ab4f8',
              fontSize: '12px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
            }}>
              {plan?.plan === 'pro' ? 'PRO' : 'FREE'}
            </span>
          </div>
          {plan && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[
                ['Chat', `${plan.usage.chat}/${plan.limits.chat}`],
                ['MCQ', `${plan.usage.mcq}/${plan.limits.mcq}`],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#1e1f20', border: '1px solid #3c3c3e', borderRadius: '10px', padding: '12px' }}>
                  <p style={{ color: '#9aa0a6', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                  <p style={{ color: '#e3e3e3', fontSize: '16px', fontWeight: '700', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          )}
          {plan?.plan !== 'pro' && (
            <button onClick={handleUpgrade} disabled={billingLoading} style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              border: 'none',
              background: billingLoading ? '#3c3c3e' : 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)',
              color: billingLoading ? '#9aa0a6' : '#131314',
              fontSize: '14px',
              fontWeight: '700',
              cursor: billingLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}>
              {billingLoading ? 'Opening Razorpay...' : 'Upgrade to Pro - ₹99/month'}
            </button>
          )}
        </div>

        {/* Appearance */}
        <div style={{ background: '#2a2b2d', borderRadius: '16px', padding: '24px', border: '1px solid #3c3c3e', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Appearance</h3>
          <Row
            label="Font Size"
            desc={`Current size: ${fontSize}px`}
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={decreaseFontSize} disabled={fontSize <= 12} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#3c3c3e', border: 'none', color: '#e3e3e3', fontSize: '14px', cursor: fontSize <= 12 ? 'not-allowed' : 'pointer', opacity: fontSize <= 12 ? 0.4 : 1 }}>A−</button>
                <span style={{ fontSize: '14px', color: '#e3e3e3', width: '28px', textAlign: 'center' }}>{fontSize}</span>
                <button onClick={increaseFontSize} disabled={fontSize >= 22} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#3c3c3e', border: 'none', color: '#e3e3e3', fontSize: '14px', cursor: fontSize >= 22 ? 'not-allowed' : 'pointer', opacity: fontSize >= 22 ? 0.4 : 1 }}>A+</button>
              </div>
            }
          />
        </div>

        {/* About */}
        <div style={{ background: '#2a2b2d', borderRadius: '16px', padding: '24px', border: '1px solid #3c3c3e', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>About</h3>
          {[
            ['Version', '1.0.0'],
            ['Platform', 'Web (PWA)'],
            ['AI Engine', 'Google Gemini'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #3c3c3e' }}>
              <span style={{ color: '#9aa0a6', fontSize: '14px' }}>{k}</span>
              <span style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '500' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Account */}
        <div style={{ background: '#2a2b2d', borderRadius: '16px', padding: '24px', border: '1px solid #3c3c3e' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Account</h3>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '13px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

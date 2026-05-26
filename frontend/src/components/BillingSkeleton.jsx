import Skeleton from './Skeleton'

export default function BillingSkeleton() {
  return (
    <>
      {/* Account card */}
      <div style={{ background: '#2a2b2d', borderRadius: '14px', padding: '20px', border: '1px solid #3c3c3e', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Skeleton style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
          <Skeleton style={{ width: '160px', height: '12px', borderRadius: '4px' }} />
        </div>
        <Skeleton style={{ width: '50px', height: '24px', borderRadius: '8px' }} />
      </div>

      {/* Usage stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ background: '#2a2b2d', borderRadius: '12px', padding: '16px', border: '1px solid #3c3c3e' }}>
            <Skeleton style={{ width: '80px', height: '12px', borderRadius: '4px', marginBottom: '12px' }} />
            <Skeleton style={{ width: '60px', height: '24px', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ height: '3px', background: '#3c3c3e', borderRadius: '100px', overflow: 'hidden' }}>
              <Skeleton style={{ height: '100%', width: '100%' }} />
            </div>
            <Skeleton style={{ width: '70px', height: '12px', borderRadius: '4px', marginTop: '10px' }} />
          </div>
        ))}
      </div>

      {/* Upgrade card */}
      <div style={{ background: '#2a2b2d', borderRadius: '16px', padding: '24px', border: '1px solid #3c3c3e', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Skeleton style={{ width: '22px', height: '22px', borderRadius: '4px' }} />
          <div>
            <Skeleton style={{ width: '160px', height: '16px', borderRadius: '4px', marginBottom: '6px' }} />
            <Skeleton style={{ width: '200px', height: '14px', borderRadius: '4px' }} />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <Skeleton style={{ width: '60px', height: '24px', borderRadius: '4px' }} />
            <Skeleton style={{ width: '40px', height: '12px', borderRadius: '4px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
          {[1, 2, 3, 4, 5].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Skeleton style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                <Skeleton style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
              </div>
              <Skeleton style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
            </div>
          ))}
        </div>

        <Skeleton style={{ width: '100%', height: '50px', borderRadius: '10px' }} />
        <Skeleton style={{ width: '180px', height: '12px', borderRadius: '4px', margin: '16px auto 0' }} />
      </div>
    </>
  )
}

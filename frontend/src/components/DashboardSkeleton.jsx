import Skeleton from './Skeleton'

export default function DashboardSkeleton() {
  const card = () => ({ background: '#2a2b2d', borderRadius: '16px', padding: '24px', border: '1px solid #3c3c3e', marginBottom: '16px' })

  return (
    <>
      {/* Accuracy */}
      <div style={card()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <Skeleton style={{ width: '120px', height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Skeleton style={{ width: '90px', height: '52px', borderRadius: '8px' }} />
              <Skeleton style={{ width: '130px', height: '24px', borderRadius: '100px' }} />
            </div>
            <Skeleton style={{ width: '180px', height: '14px', borderRadius: '4px', marginTop: '12px' }} />
          </div>
        </div>
        <div style={{ height: '4px', background: '#3c3c3e', borderRadius: '100px', overflow: 'hidden' }}>
          <Skeleton style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ background: '#2a2b2d', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid #3c3c3e' }}>
            <Skeleton style={{ width: '40px', height: '36px', borderRadius: '4px', margin: '0 auto 8px' }} />
            <Skeleton style={{ width: '60px', height: '14px', borderRadius: '4px', margin: '0 auto' }} />
          </div>
        ))}
      </div>

      {/* Weak topics */}
      <div style={card()}>
        <Skeleton style={{ width: '120px', height: '16px', borderRadius: '4px', marginBottom: '24px' }} />
        {[1, 2, 3].map((t, i) => (
          <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px solid #3c3c3e' : 'none' }}>
            <div>
              <Skeleton style={{ width: '100px', height: '16px', borderRadius: '4px', marginBottom: '6px' }} />
              <Skeleton style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Skeleton style={{ width: '30px', height: '16px', borderRadius: '4px' }} />
              <Skeleton style={{ width: '80px', height: '28px', borderRadius: '100px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div style={card()}>
        <Skeleton style={{ width: '140px', height: '16px', borderRadius: '4px', marginBottom: '24px' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <Skeleton key={i} style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
          ))}
        </div>
      </div>

      <Skeleton style={{ width: '100%', height: '52px', borderRadius: '12px' }} />
    </>
  )
}

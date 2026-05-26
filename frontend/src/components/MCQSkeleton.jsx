import Skeleton from './Skeleton'

export default function MCQSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#2a2b2d', borderRadius: '12px', padding: '22px', border: '1px solid #3c3c3e' }}>
        <Skeleton style={{ width: '100%', height: '16px', borderRadius: '4px', marginBottom: '8px' }} />
        <Skeleton style={{ width: '85%', height: '16px', borderRadius: '4px' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {[1, 2, 3, 4].map(option => (
          <div key={option} style={{
            width: '100%', padding: '15px 18px', borderRadius: '10px',
            background: '#1e1f20', border: '1px solid #3c3c3e'
          }}>
            <Skeleton style={{ width: '60%', height: '14px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

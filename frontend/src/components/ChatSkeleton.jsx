import Skeleton from './Skeleton'

function SparkleIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="sg-sk" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8"/>
          <stop offset="50%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#f472b6"/>
        </linearGradient>
      </defs>
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" fill="url(#sg-sk)"/>
    </svg>
  )
}

export default function ChatSkeleton() {
  const dummyMessages = [
    { role: 'user', lines: ['180px'] },
    { role: 'model', lines: ['100%', '80%', '60%'] },
    { role: 'user', lines: ['220px'] },
    { role: 'model', lines: ['90%', '70%'] },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {dummyMessages.map((m, i) => (
        <div key={i} style={{
          display: 'flex',
          flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
          gap: '10px',
          marginBottom: '20px',
        }}>
          {m.role === 'model' && (
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              <SparkleIcon size={24} />
            </div>
          )}
          <div style={{ 
            maxWidth: m.role === 'user' ? '70%' : '85%', 
            width: m.role === 'user' ? 'auto' : '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{
              padding: m.role === 'user' ? '12px 16px' : '4px 0',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '0',
              background: m.role === 'user' ? '#2a2b2d' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {m.lines.map((w, j) => (
                <Skeleton key={j} style={{ width: w, height: '14px', borderRadius: '4px' }} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

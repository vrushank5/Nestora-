import './Skeleton.css'

export function Skeleton({ width, height, borderRadius, style, className = '' }) {
  return (
    <div
      className={`skeleton-base ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
        borderRadius: borderRadius || 'var(--radius, 8px)',
        ...style,
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height="180px" borderRadius="12px" />
      <div className="skeleton-card-body">
        <Skeleton width="70%" height="1.3rem" style={{ marginBottom: '8px' }} />
        <Skeleton width="40%" height="0.9rem" style={{ marginBottom: '14px' }} />
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
          <Skeleton width="60px" height="24px" borderRadius="16px" />
          <Skeleton width="60px" height="24px" borderRadius="16px" />
          <Skeleton width="60px" height="24px" borderRadius="16px" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--line, #eee)' }}>
          <Skeleton width="90px" height="1.4rem" />
          <Skeleton width="90px" height="32px" borderRadius="8px" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 4, cols = 5 }) {
  return (
    <div className="skeleton-table-wrapper">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="1rem" width="80%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height="1.1rem" width={c === 0 ? '60%' : '75%'} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonDetail() {
  return (
    <div className="skeleton-detail-wrapper">
      <Skeleton height="360px" borderRadius="16px" style={{ marginBottom: '24px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
        <div>
          <Skeleton width="50%" height="2rem" style={{ marginBottom: '12px' }} />
          <Skeleton width="30%" height="1rem" style={{ marginBottom: '24px' }} />
          <Skeleton height="100px" borderRadius="12px" style={{ marginBottom: '24px' }} />
          <Skeleton height="150px" borderRadius="12px" />
        </div>
        <div>
          <Skeleton height="300px" borderRadius="16px" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className="skeleton-stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <Skeleton width="44px" height="44px" borderRadius="10px" />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height="0.8rem" style={{ marginBottom: '8px' }} />
            <Skeleton width="40%" height="1.4rem" />
          </div>
        </div>
      ))}
    </div>
  )
}

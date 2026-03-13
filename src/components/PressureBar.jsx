import React from 'react'

function PressureBar({ percent, urgencyLevel, animated = true, showLabel = false, height = 4 }) {
  const colors = {
    low:     { fill: 'linear-gradient(90deg,var(--green-dim),var(--green))',     glow: 'var(--green)' },
    medium:  { fill: 'linear-gradient(90deg,var(--yellow-dim),var(--yellow))',   glow: 'var(--yellow)' },
    urgent:  { fill: 'linear-gradient(90deg,var(--orange-dim),var(--orange))',   glow: 'var(--orange)' },
    critical:{ fill: 'linear-gradient(90deg,var(--red-dim),var(--red))',         glow: 'var(--red)' },
    overdue: { fill: 'linear-gradient(90deg,#cc0022,var(--red))',                glow: 'var(--red)' },
  }
  const c = colors[urgencyLevel] || colors.low
  const pct = Math.min(100, Math.max(0, percent))

  return (
    <div
      className="pressure-bar-wrapper"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={`Urgency pressure: ${Math.round(pct)}%`}
    >
      {showLabel && (
        <div className="pressure-bar-label">
          <span style={{ color: c.glow }}>PRESSURE</span>
          <span style={{ color: c.glow }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="pressure-bar-track" style={{ height }}>
        <div
          className={`pressure-bar-fill${animated && urgencyLevel === 'critical' ? ' critical-pulse' : ''}`}
          style={{
            width: `${pct}%`,
            background: c.fill,
            boxShadow: `0 0 8px ${c.glow}66`,
          }}
        />
        <div className="pressure-tick" style={{ left: '25%' }} />
        <div className="pressure-tick" style={{ left: '50%' }} />
        <div className="pressure-tick" style={{ left: '75%' }} />
      </div>
    </div>
  )
}

export default PressureBar
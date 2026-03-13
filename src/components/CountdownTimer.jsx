import React from 'react'
import { useSingleTaskPressure } from '../hooks/useDeadlinePressure'

function CountdownTimer({ task, size = 'normal' }) {
  const p = useSingleTaskPressure(task)
  if (!p) return null

  const colors = { low:'var(--green)', medium:'var(--yellow)', urgent:'var(--orange)', critical:'var(--red)', overdue:'var(--red)' }
  const color = colors[p.urgencyLevel]

  return (
    <div
      className={`countdown countdown-${size}${p.urgencyLevel === 'critical' ? ' critical' : ''}`}
      role="timer"
      aria-label={`Time remaining: ${p.countdown.display}`}
    >
      <span className="countdown-value" style={{ color }}>{p.countdown.display}</span>
      {size !== 'small' && <span className="countdown-label">REMAINING</span>}
    </div>
  )
}

export default CountdownTimer
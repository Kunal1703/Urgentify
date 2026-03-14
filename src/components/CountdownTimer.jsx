import React, { useRef, useEffect, useState } from 'react'
import { useSingleTaskPressure } from '../hooks/useDeadlinePressure'

const COLORS = {
  low:'var(--green)', medium:'var(--yellow)',
  urgent:'var(--orange)', critical:'var(--red)', overdue:'var(--red)'
}

// Single flip digit with animation
function FlipDigit({ value, color }) {
  const [displayed, setDisplayed] = useState(value)
  const [flipping, setFlipping]   = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlipping(true)
      const t = setTimeout(() => {
        setDisplayed(value)
        setFlipping(false)
        prevRef.current = value
      }, 200)
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <div className="flip-digit-wrapper" style={{ '--flip-color': color }}>
      <div className={`flip-digit${flipping ? ' flipping' : ''}`}>
        <span className="flip-top">{displayed}</span>
        <div className="flip-divider" />
        <span className="flip-bottom">{displayed}</span>
      </div>
      {flipping && (
        <div className="flip-card-front">
          <span>{prevRef.current}</span>
        </div>
      )}
    </div>
  )
}

function FlipClock({ display, color, size }) {
  // Parse display like "HH:MM:SS" or "2d 03h 14m"
  const parts = display.split(':')
  if (parts.length === 3) {
    const [h, m, s] = parts
    return (
      <div className={`flip-clock flip-clock-${size}`}>
        <FlipGroup chars={h.split('')} color={color} />
        <span className="flip-sep" style={{ color }}>:</span>
        <FlipGroup chars={m.split('')} color={color} />
        <span className="flip-sep" style={{ color }}>:</span>
        <FlipGroup chars={s.split('')} color={color} />
      </div>
    )
  }
  // fallback plain display
  return (
    <div className={`flip-clock flip-clock-${size}`}>
      {display.split('').map((ch, i) =>
        ch === ':' || ch === ' ' || ch === 'd' || ch === 'h' || ch === 'm'
          ? <span key={i} className="flip-sep" style={{ color }}>{ch}</span>
          : <FlipDigit key={i} value={ch} color={color} />
      )}
    </div>
  )
}

function FlipGroup({ chars, color }) {
  return (
    <div className="flip-group">
      {chars.map((ch, i) => <FlipDigit key={i} value={ch} color={color} />)}
    </div>
  )
}

function CountdownTimer({ task, size = 'normal' }) {
  const p = useSingleTaskPressure(task)
  if (!p) return null
  const color = COLORS[p.urgencyLevel]

  if (size === 'small') {
    // Small = plain text, no flip (too tiny)
    return (
      <div className={`countdown countdown-small${p.urgencyLevel === 'critical' ? ' critical' : ''}`}
        role="timer" aria-label={`Time remaining: ${p.countdown.display}`}>
        <span className="countdown-value" style={{ color }}>{p.countdown.display}</span>
      </div>
    )
  }

  return (
    <div className={`countdown countdown-${size}${p.urgencyLevel === 'critical' ? ' critical' : ''}`}
      role="timer" aria-label={`Time remaining: ${p.countdown.display}`}>
      <FlipClock display={p.countdown.display} color={color} size={size} />
      <span className="countdown-label">REMAINING</span>
    </div>
  )
}

export default CountdownTimer
import React, { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRadarRing, getHoursRemaining } from '../utils/timecalculator'

const RINGS = [
  { label: 'LOW',      sub: '>24h',  color: '#00ff88', r: 0.88 },
  { label: 'MEDIUM',   sub: '6–24h', color: '#ffd60a', r: 0.65 },
  { label: 'URGENT',   sub: '2–6h',  color: '#ff8c00', r: 0.44 },
  { label: 'CRITICAL', sub: '<2h',   color: '#ff2d55', r: 0.24 },
]

function UrgencyRadar({ tasks }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const [hovered, setHovered] = useState(null)
  const [positions, setPositions] = useState([])
  const navigate = useNavigate()

  const active = tasks.filter(t => getHoursRemaining(t.deadline) > 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const SIZE = canvas.offsetWidth || 260
    canvas.width = SIZE
    canvas.height = SIZE
    const cx = SIZE / 2, cy = SIZE / 2, maxR = SIZE / 2 - 20

    // Stable positions computed once per task-list change
    const pts = active.map((task, i) => {
      const ring = getRadarRing(task.deadline)
      const ringR = RINGS[ring].r * maxR
      const angle = (i / Math.max(active.length, 1)) * Math.PI * 2 - Math.PI / 2
      const offset = Math.sin(i * 137.5) * 0.07 * maxR
      return { task, ring, angle, r: ringR + offset, color: RINGS[ring].color }
    })
    setPositions(pts)

    let frame = 0
    const draw = () => {
      frame++
      ctx.clearRect(0, 0, SIZE, SIZE)

      // Background
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, SIZE, SIZE)

      // Rotating grid lines
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(frame * 0.002)
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(a) * maxR * 1.1, Math.sin(a) * maxR * 1.1)
        ctx.strokeStyle = 'rgba(30,45,61,0.5)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
      ctx.restore()

      // Rings
      RINGS.forEach((ring, idx) => {
        const r = ring.r * maxR * (1 + Math.sin(frame * 0.02 + idx) * 0.003)
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = ring.color + '44'
        ctx.lineWidth = 1
        ctx.stroke()

        // Ring fill glow
        const grd = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.08)
        grd.addColorStop(0, ring.color + '00')
        grd.addColorStop(0.5, ring.color + '10')
        grd.addColorStop(1, ring.color + '00')
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Ring label
        ctx.font = '9px "Space Mono", monospace'
        ctx.fillStyle = ring.color + 'aa'
        ctx.textAlign = 'left'
        ctx.fillText(ring.label, cx + r * 0.707 + 4, cy - r * 0.707)
      })

      // Scan sweep
      const scanA = (frame * 0.025) % (Math.PI * 2) - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, maxR, scanA - 0.45, scanA)
      ctx.closePath()
      ctx.fillStyle = 'rgba(0,255,136,0.05)'
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(scanA) * maxR, cy + Math.sin(scanA) * maxR)
      ctx.strokeStyle = 'rgba(0,255,136,0.55)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Center
      ctx.beginPath()
      ctx.arc(cx, cy, 4 + Math.sin(frame * 0.05), 0, Math.PI * 2)
      ctx.fillStyle = '#00ff88'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx, cy, 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,255,136,0.28)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Task dots
      pts.forEach(pos => {
        const x = cx + Math.cos(pos.angle) * pos.r
        const y = cy + Math.sin(pos.angle) * pos.r
        const isCrit = pos.ring === 3
        const isHov  = hovered?.id === pos.task.id

        // Glow aura
        const aura = ctx.createRadialGradient(x, y, 0, x, y, isHov ? 18 : 10)
        aura.addColorStop(0, pos.color + (isCrit ? 'bb' : '77'))
        aura.addColorStop(1, pos.color + '00')
        ctx.beginPath()
        ctx.arc(x, y, isHov ? 18 : 10, 0, Math.PI * 2)
        ctx.fillStyle = aura
        ctx.fill()

        // Core dot
        const dotR = isHov ? 7 : isCrit ? 5 + Math.sin(frame * 0.1) * 1.5 : 4
        ctx.beginPath()
        ctx.arc(x, y, dotR, 0, Math.PI * 2)
        ctx.fillStyle = pos.color
        ctx.fill()

        // Hover label
        if (isHov) {
          const label = pos.task.title.slice(0, 16) + (pos.task.title.length > 16 ? '…' : '')
          ctx.font = 'bold 10px "Space Mono", monospace'
          ctx.fillStyle = pos.color
          ctx.textAlign = 'center'
          ctx.fillText(label, x, y - dotR - 8)
        }
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [active.length, hovered])

  const handleMouseMove = e => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const mx = (e.clientX - rect.left) * sx
    const my = (e.clientY - rect.top) * sy
    const cx = canvas.width / 2, cy = canvas.height / 2, maxR = canvas.width / 2 - 20

    let found = null
    positions.forEach(pos => {
      const x = cx + Math.cos(pos.angle) * pos.r
      const y = cy + Math.sin(pos.angle) * pos.r
      if (Math.hypot(mx - x, my - y) < 14) found = pos.task
    })
    setHovered(found)
  }

  return (
    <div className="urgency-radar">
      <div className="radar-header">
        <span className="radar-title">URGENCY RADAR</span>
        <span className="radar-count">{active.length} ACTIVE</span>
      </div>
      <div className="radar-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="radar-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
          onClick={() => hovered && navigate(`/focus/${hovered.id}`)}
          style={{ cursor: hovered ? 'pointer' : 'crosshair' }}
          aria-label="Urgency radar showing task deadlines"
          role="img"
        />
        {hovered && (
          <div className="radar-tooltip">
            <span>{hovered.title}</span>
            <span className="tooltip-action">Click to focus →</span>
          </div>
        )}
      </div>
      <div className="radar-legend">
        {[...RINGS].reverse().map(ring => (
          <div key={ring.label} className="legend-item">
            <span className="legend-dot" style={{ background: ring.color }} />
            <span className="legend-label" style={{ color: ring.color }}>{ring.label}</span>
            <span className="legend-sub">{ring.sub}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UrgencyRadar
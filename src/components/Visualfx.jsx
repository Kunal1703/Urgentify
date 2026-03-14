import React, { useEffect, useRef, useCallback } from 'react'

function VisualFX() {
  const canvasRef    = useRef(null)
  const spotRef      = useRef(null)
  const mouseRef     = useRef({ x: -500, y: -500 })
  const particlesRef = useRef([])
  const rafRef       = useRef(null)
  const frameRef     = useRef(0)

  // ── Cursor spotlight follows mouse ──────────────────────────
  useEffect(() => {
    const spot = spotRef.current
    if (!spot) return
    const onMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      spot.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // ── Canvas: particles + animated neon grid ─────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Color palette — neon green, cyan, orange, purple
    const PALETTE = [
      'rgba(0,255,136,',    // neon green
      'rgba(0,212,255,',    // cyan blue
      'rgba(255,140,0,',    // orange
      'rgba(168,85,247,',   // purple
      'rgba(0,255,200,',    // teal
    ]

    function makeParticle() { return null } // particles disabled

    // Grid line color cycle
    const GRID_COLORS = [
      [0,255,136],   // green
      [0,212,255],   // cyan
      [255,140,0],   // orange
      [168,85,247],  // purple
    ]
    let colorIdx  = 0
    let colorT    = 0
    const COLOR_SPEED = 0.004

    function lerpColor(a, b, t) {
      return a.map((v,i) => Math.round(v + (b[i]-v)*t))
    }

    const draw = () => {
      frameRef.current++
      const frame = frameRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ── Animated neon grid ───────────────────────────────
      colorT += COLOR_SPEED
      if (colorT >= 1) { colorT = 0; colorIdx = (colorIdx+1) % GRID_COLORS.length }
      const nextIdx = (colorIdx+1) % GRID_COLORS.length
      const [r,g,b] = lerpColor(GRID_COLORS[colorIdx], GRID_COLORS[nextIdx], colorT)

      const CELL = 48
      const COLS = Math.ceil(canvas.width  / CELL) + 1
      const ROWS = Math.ceil(canvas.height / CELL) + 1
      const offX = (frame * 0.3) % CELL
      const offY = (frame * 0.15) % CELL

      // Draw grid lines with distance-to-cursor glow
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (let c = 0; c <= COLS; c++) {
        const x = c * CELL - offX
        const distX = Math.abs(x - mx)
        const glow  = Math.max(0, 1 - distX / 200)
        const alpha = 0.04 + glow * 0.18
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.lineWidth = glow > 0.3 ? 1.5 : 0.5
        ctx.stroke()
      }

      for (let row = 0; row <= ROWS; row++) {
        const y = row * CELL - offY
        const distY = Math.abs(y - my)
        const glow  = Math.max(0, 1 - distY / 200)
        const alpha = 0.04 + glow * 0.18
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.lineWidth = glow > 0.3 ? 1.5 : 0.5
        ctx.stroke()
      }

      // Grid intersection dots near cursor
      for (let c = 0; c <= COLS; c++) {
        for (let row = 0; row <= ROWS; row++) {
          const x = c * CELL - offX
          const y = row * CELL - offY
          const dist = Math.hypot(x - mx, y - my)
          if (dist < 120) {
            const glow = (1 - dist/120) * 0.7
            ctx.beginPath()
            ctx.arc(x, y, 2, 0, Math.PI*2)
            ctx.fillStyle = `rgba(${r},${g},${b},${glow})`
            ctx.fill()
          }
        }
      }

      // ── Particles removed ────────────────────────────────

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      {/* Canvas layer — grid + particles */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', inset: 0,
          width: '100vw', height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Cursor spotlight */}
      <div
        ref={spotRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, rgba(0,212,255,0.03) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
          transform: 'translate(-500px,-500px)',
          transition: 'none',
          mixBlendMode: 'screen',
        }}
        aria-hidden="true"
      />

      {/* Ambient gradient glow blobs */}
      <div style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }} aria-hidden="true">
        {/* Top-left green blob */}
        <div style={{
          position: 'absolute',
          top: '-15%', left: '-10%',
          width: '45%', height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,255,136,0.055) 0%, transparent 65%)',
          animation: 'blob-float-1 12s ease-in-out infinite',
        }} />
        {/* Top-right cyan blob */}
        <div style={{
          position: 'absolute',
          top: '-20%', right: '-15%',
          width: '50%', height: '55%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,212,255,0.045) 0%, transparent 65%)',
          animation: 'blob-float-2 15s ease-in-out infinite',
        }} />
        {/* Bottom-center orange blob */}
        <div style={{
          position: 'absolute',
          bottom: '-20%', left: '30%',
          width: '40%', height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,140,0,0.035) 0%, transparent 65%)',
          animation: 'blob-float-3 18s ease-in-out infinite',
        }} />
        {/* Bottom-left purple blob */}
        <div style={{
          position: 'absolute',
          bottom: '-10%', left: '-10%',
          width: '35%', height: '45%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.04) 0%, transparent 65%)',
          animation: 'blob-float-4 20s ease-in-out infinite',
        }} />
      </div>
    </>
  )
}

export default VisualFX
import { useCallback } from 'react'

// Pure canvas confetti — no npm package needed
function randomRange(min, max) {
  return Math.random() * (max - min) + min
}

export function useConfetti() {
  const fire = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 100vw; height: 100vh;
      pointer-events: none; z-index: 99999;
    `
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')

    const COLORS = ['#00ff88', '#ffd60a', '#ff8c00', '#ff2d55', '#00d4ff', '#a855f7', '#ffffff']
    const SHAPES = ['rect', 'circle', 'line']
    const COUNT = 120

    const particles = Array.from({ length: COUNT }, () => ({
      x: randomRange(canvas.width * 0.2, canvas.width * 0.8),
      y: randomRange(-20, canvas.height * 0.3),
      vx: randomRange(-6, 6),
      vy: randomRange(-14, -4),
      gravity: randomRange(0.3, 0.6),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: randomRange(6, 14),
      rotation: randomRange(0, Math.PI * 2),
      rotationSpeed: randomRange(-0.15, 0.15),
      opacity: 1,
      decay: randomRange(0.012, 0.022),
    }))

    let rafId
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false

      particles.forEach(p => {
        if (p.opacity <= 0) return
        alive = true
        p.x  += p.vx
        p.vy += p.gravity
        p.y  += p.vy
        p.rotation += p.rotationSpeed
        p.opacity  -= p.decay

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.strokeStyle = p.color

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(-p.size / 2, 0)
          ctx.lineTo(p.size / 2, 0)
          ctx.stroke()
        }
        ctx.restore()
      })

      if (alive) {
        rafId = requestAnimationFrame(animate)
      } else {
        cancelAnimationFrame(rafId)
        document.body.removeChild(canvas)
      }
    }

    rafId = requestAnimationFrame(animate)
  }, [])

  return { fire }
}
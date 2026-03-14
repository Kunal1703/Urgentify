import React, { useEffect, useRef } from 'react'

function CustomCursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)
  // Ring lags slightly behind dot for smooth feel
  const ringPos = useRef({ x: -100, y: -100 })
  const mouse   = useRef({ x: -100, y: -100 })
  const rafRef  = useRef(null)

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      // Dot follows instantly
      dot.style.left = `${e.clientX}px`
      dot.style.top  = `${e.clientY}px`
    }

    const onDown = () => {
      dot.classList.add('clicking')
      ring.classList.add('clicking')
    }

    const onUp = () => {
      dot.classList.remove('clicking')
      ring.classList.remove('clicking')
    }

    // Hover detection on interactive elements
    const onEnter = (e) => {
      if (e.target.closest('button,a,input,select,textarea,[role="button"],.task-card')) {
        dot.classList.add('hovering')
        ring.classList.add('hovering')
      }
    }
    const onLeave = () => {
      dot.classList.remove('hovering')
      ring.classList.remove('hovering')
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup',   onUp)
    window.addEventListener('mouseover', onEnter)
    window.addEventListener('mouseout',  onLeave)

    // Ring follows with lerp (lag)
    const animate = () => {
      const LERP = 0.12
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * LERP
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * LERP
      ring.style.left = `${ringPos.current.x}px`
      ring.style.top  = `${ringPos.current.y}px`
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('mouseover', onEnter)
      window.removeEventListener('mouseout',  onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}

export default CustomCursor
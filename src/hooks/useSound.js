import { useCallback, useRef } from 'react'

// Pure Web Audio API sound engine — zero npm packages
function createAudioContext() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)()
  } catch {
    return null
  }
}

function playTone(ctx, freq, type, duration, volume = 0.3, delay = 0) {
  if (!ctx) return
  const osc   = ctx.createOscillator()
  const gain  = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type      = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
  gain.gain.setValueAtTime(0, ctx.currentTime + delay)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
  osc.start(ctx.currentTime + delay)
  osc.stop(ctx.currentTime + delay + duration + 0.05)
}

export function useSound() {
  const ctxRef = useRef(null)

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = createAudioContext()
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  // ✓ Task complete — satisfying ascending chime
  const playComplete = useCallback(() => {
    const ctx = getCtx()
    playTone(ctx, 523, 'sine', 0.15, 0.25, 0.00)  // C5
    playTone(ctx, 659, 'sine', 0.15, 0.25, 0.12)  // E5
    playTone(ctx, 784, 'sine', 0.25, 0.30, 0.24)  // G5
    playTone(ctx, 1047,'sine', 0.30, 0.40, 0.38)  // C6
  }, [])

  // ⚠ Critical alert — urgent beep
  const playCritical = useCallback(() => {
    const ctx = getCtx()
    playTone(ctx, 880, 'square', 0.08, 0.15, 0.00)
    playTone(ctx, 880, 'square', 0.08, 0.15, 0.15)
    playTone(ctx, 660, 'square', 0.12, 0.25, 0.30)
  }, [])

  // 🔔 Add task — soft click
  const playAdd = useCallback(() => {
    const ctx = getCtx()
    playTone(ctx, 440, 'sine', 0.10, 0.15, 0.00)
    playTone(ctx, 550, 'sine', 0.08, 0.15, 0.08)
  }, [])

  // ⏱ Pomodoro done — triumphant
  const playPomoDone = useCallback(() => {
    const ctx = getCtx()
    playTone(ctx, 392, 'sine', 0.12, 0.20, 0.00)  // G4
    playTone(ctx, 523, 'sine', 0.12, 0.20, 0.12)  // C5
    playTone(ctx, 659, 'sine', 0.12, 0.20, 0.24)  // E5
    playTone(ctx, 784, 'sine', 0.20, 0.35, 0.36)  // G5
    playTone(ctx, 1047,'sine', 0.25, 0.50, 0.50)  // C6
  }, [])

  // 🔕 Tick — subtle for pomodoro
  const playTick = useCallback(() => {
    const ctx = getCtx()
    playTone(ctx, 1200, 'sine', 0.03, 0.06, 0.00)
  }, [])

  return { playComplete, playCritical, playAdd, playPomoDone, playTick }
}
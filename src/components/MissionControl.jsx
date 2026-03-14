import React, { useEffect, useState } from 'react'

const BOOT_LINES = [
  '> INITIALIZING DEADLINE-OS v2.0...',
  '> LOADING TASK KERNEL...',
  '> MOUNTING URGENCY RADAR...',
  '> CALIBRATING PRESSURE SENSORS...',
  '> SYNCING DEADLINE MATRIX...',
  '> ALL SYSTEMS OPERATIONAL.',
  '> LAUNCHING MISSION CONTROL...',
]

function MissionControl({ onComplete }) {
  const [lines, setLines]       = useState([])
  const [phase, setPhase]       = useState('boot')  // boot | logo | launch
  const [logoVisible, setLogo]  = useState(false)
  const [launching, setLaunch]  = useState(false)

  // Boot lines appear one by one
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines(l => [...l, BOOT_LINES[i]])
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => { setPhase('logo'); setLogo(true) }, 200)
        setTimeout(() => { setLaunch(true) }, 900)
        setTimeout(() => onComplete(), 1700)
      }
    }, 160)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className={`mc-overlay${launching ? ' mc-launching' : ''}`} aria-label="Loading DeadlineOS" role="status">
      {/* Background grid pulse */}
      <div className="mc-grid-bg" />

      {/* Radar rings */}
      <div className="mc-radar">
        {[1,2,3,4].map(i => (
          <div key={i} className="mc-radar-ring" style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
        <div className="mc-radar-dot" />
      </div>

      {/* Logo */}
      <div className={`mc-logo${logoVisible ? ' visible' : ''}`}>
        <div className="mc-logo-text">D//OS</div>
        <div className="mc-logo-sub">DEADLINE OPERATING SYSTEM</div>
        <div className="mc-logo-bar" />
      </div>

      {/* Boot terminal */}
      <div className="mc-terminal" aria-live="polite">
        {lines.map((line, i) => (
          <div key={i} className="mc-line" style={{ animationDelay: `${i * 0.02}s` }}>
            <span className={`mc-line-text${i === lines.length - 1 ? ' mc-line-active' : ''}`}>
              {line}
            </span>
          </div>
        ))}
        {phase === 'boot' && <span className="mc-cursor">█</span>}
      </div>

      {/* Corner decorations */}
      <div className="mc-corner mc-corner-tl" />
      <div className="mc-corner mc-corner-tr" />
      <div className="mc-corner mc-corner-bl" />
      <div className="mc-corner mc-corner-br" />

      {/* Scan line */}
      <div className="mc-scan" />
    </div>
  )
}

export default MissionControl
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTaskContext } from '../App.jsx'
import { useSingleTaskPressure } from '../hooks/useDeadlinePressure'
import { useConfetti } from '../hooks/useConfetti'
import PressureBar from '../components/PressureBar.jsx'

const COLORS = { low:'var(--green)', medium:'var(--yellow)', urgent:'var(--orange)', critical:'var(--red)', overdue:'var(--red)' }

const POMO_MODES = {
  work:       { label:'FOCUS',        duration: 25 * 60, color:'var(--green)' },
  shortBreak: { label:'SHORT BREAK',  duration:  5 * 60, color:'var(--yellow)' },
  longBreak:  { label:'LONG BREAK',   duration: 15 * 60, color:'var(--orange)' },
}

function Pomodoro() {
  const [mode, setMode]         = useState('work')
  const [secondsLeft, setSecs]  = useState(POMO_MODES.work.duration)
  const [running, setRunning]   = useState(false)
  const [completed, setDone]    = useState(0)
  const [round, setRound]       = useState(1)
  const intervalRef             = useRef(null)
  const { fire }                = useConfetti()
  const cur                     = POMO_MODES[mode]
  const pct                     = ((cur.duration - secondsLeft) / cur.duration) * 100
  const mm                      = String(Math.floor(secondsLeft / 60)).padStart(2,'0')
  const ss                      = String(secondsLeft % 60).padStart(2,'0')

  const switchMode = useCallback((m) => {
    clearInterval(intervalRef.current)
    setMode(m); setSecs(POMO_MODES[m].duration); setRunning(false)
  }, [])

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          if (mode === 'work') {
            fire()
            setDone(c => c + 1)
            const nr = round + 1; setRound(nr)
            switchMode(nr % 4 === 0 ? 'longBreak' : 'shortBreak')
          } else {
            switchMode('work')
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, mode, round, switchMode, fire])

  const R    = 54
  const circ = 2 * Math.PI * R
  const dash = circ * (1 - pct / 100)

  return (
    <div className="pomodoro-widget">
      <div className="pomo-header">
        <span className="pomo-title">POMODORO</span>
        <div className="pomo-rounds">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="pomo-round-dot"
              style={{ background: i < (completed % 4) ? cur.color : 'var(--border)' }} />
          ))}
        </div>
      </div>

      <div className="pomo-modes">
        {Object.entries(POMO_MODES).map(([key, val]) => (
          <button key={key}
            className={`pomo-mode-btn${mode === key ? ' active' : ''}`}
            style={mode === key ? { borderColor: val.color, color: val.color } : {}}
            onClick={() => switchMode(key)}
          >{val.label}</button>
        ))}
      </div>

      <div className="pomo-circle-wrapper">
        <svg className="pomo-svg" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="64" cy="64" r={R} fill="none"
            stroke={cur.color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={dash}
            transform="rotate(-90 64 64)"
            style={{ transition:'stroke-dashoffset 0.8s ease, stroke 0.4s ease',
              filter:`drop-shadow(0 0 8px ${cur.color}88)` }}
          />
        </svg>
        <div className="pomo-time-overlay">
          <div className="pomo-time" style={{ color: cur.color }}>{mm}:{ss}</div>
          <div className="pomo-mode-label" style={{ color: cur.color }}>{cur.label}</div>
        </div>
      </div>

      <div className="pomo-controls">
        <button className="pomo-btn pomo-reset" onClick={() => { setSecs(cur.duration); setRunning(false) }}>↺</button>
        <button className={`pomo-btn pomo-play${running ? ' running' : ''}`}
          style={{ background: cur.color, color:'var(--bg-primary)' }}
          onClick={() => setRunning(r => !r)}>
          {running ? '⏸ PAUSE' : '▶ START'}
        </button>
        <button className="pomo-btn pomo-skip"
          onClick={() => switchMode(mode === 'work' ? 'shortBreak' : 'work')}>⏭</button>
      </div>

      <div className="pomo-session-count">
        <span className="pomo-session-label">SESSIONS DONE</span>
        <span className="pomo-session-val" style={{ color: cur.color }}>{completed}</span>
      </div>
    </div>
  )
}

function FocusMode() {
  const { id }                  = useParams()
  const navigate                = useNavigate()
  const { tasks, completeTask } = useTaskContext()
  const { fire }                = useConfetti()
  const [selId, setSelId]       = useState(id || null)
  const [completing, setComp]   = useState(false)

  const sorted = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
  const task   = selId ? tasks.find(t => t.id === selId) : sorted[0]
  const p      = useSingleTaskPressure(task)

  useEffect(() => {
    if (!selId && sorted.length > 0) setSelId(sorted[0].id)
  }, [tasks.length])

  const handleComplete = () => {
    setComp(true)
    fire()
    setTimeout(() => { completeTask(task.id); navigate('/') }, 1400)
  }

  if (tasks.length === 0) return (
    <div className="focus-empty">
      <div className="focus-empty-icon">◎</div>
      <div>NO ACTIVE TASKS</div>
      <button className="focus-empty-add" onClick={() => navigate('/add')}>+ ADD TASK</button>
    </div>
  )

  if (!task || !p) return null
  const color = COLORS[p.urgencyLevel]

  return (
    <div className={`focus-mode${completing ? ' completing' : ''}`}>
      <button className="focus-back" onClick={() => navigate('/')}>← EXIT FOCUS</button>

      <div className="focus-layout focus-layout-3col">

        {/* LEFT — Pomodoro */}
        <div className="focus-sidebar-left">
          <Pomodoro />
        </div>

        {/* CENTER — Task details */}
        <div className="focus-main">
          <div className="focus-urgency" style={{ color }}>
            <span className={`focus-urgency-dot${p.urgencyLevel === 'critical' ? ' blink' : ''}`}
              style={{ background: color }} />
            {p.urgencyLevel.toUpperCase()} PRIORITY
          </div>

          <div className="focus-countdown-wrapper">
            <div className={`focus-countdown${p.urgencyLevel === 'critical' ? ' critical-shake' : ''}`}
              style={{ color }} role="timer">
              {p.countdown.display}
            </div>
            <div className="focus-countdown-label">TIME REMAINING</div>
          </div>

          <h1 className="focus-title">{task.title}</h1>
          {task.description && <p className="focus-description">{task.description}</p>}

          <div className="focus-meta">
            <div className="focus-meta-item">
              <span className="focus-meta-label">CATEGORY</span>
              <span style={{ color }}>{task.category?.toUpperCase()}</span>
            </div>
            <div className="focus-meta-divider" />
            <div className="focus-meta-item">
              <span className="focus-meta-label">DEADLINE</span>
              <span>{new Date(task.deadline).toLocaleString('en-US',{ month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
            </div>
            {task.estimatedHours && (
              <>
                <div className="focus-meta-divider" />
                <div className="focus-meta-item">
                  <span className="focus-meta-label">ESTIMATED</span>
                  <span>{task.estimatedHours}h</span>
                </div>
              </>
            )}
          </div>

          {p.feasibility && task.estimatedHours && (
            <div className="focus-feasibility" style={{ borderColor: p.feasibility.color + '44' }}>
              <div className="focus-feasibility-row">
                <span className="focus-feas-label">WORK REQUIRED</span>
                <span className="focus-feas-value" style={{ color }}>{task.estimatedHours}h</span>
              </div>
              <div className="focus-feasibility-row">
                <span className="focus-feas-label">TIME AVAILABLE</span>
                <span className="focus-feas-value" style={{ color }}>{Math.max(0, p.hoursRemaining).toFixed(1)}h</span>
              </div>
              <div className="focus-feasibility-row">
                <span className="focus-feas-label">VERDICT</span>
                <span className="focus-feas-value" style={{ color: p.feasibility.color }}>{p.feasibility.label}</span>
              </div>
            </div>
          )}

          <div className="focus-pressure">
            <PressureBar percent={p.pressurePercent} urgencyLevel={p.urgencyLevel} height={6} showLabel />
          </div>

          <div className="focus-actions">
            <button
              className={`focus-done-btn${completing ? ' completing' : ''}`}
              onClick={handleComplete} disabled={completing}>
              {completing ? '🎉 COMPLETED!' : '✓ MARK COMPLETE'}
            </button>
            <button className="focus-next-btn"
              disabled={sorted.findIndex(t => t.id === task.id) >= sorted.length - 1}
              onClick={() => {
                const idx = sorted.findIndex(t => t.id === task.id)
                if (idx < sorted.length - 1) setSelId(sorted[idx + 1].id)
              }}>
              NEXT TASK →
            </button>
          </div>
        </div>

        {/* RIGHT — Task switcher */}
        <aside className="focus-switcher">
          <div className="switcher-header">SWITCH TASK</div>
          <div className="switcher-list" role="list">
            {sorted.map(t => {
              const h   = (new Date(t.deadline) - new Date()) / 3600000
              const lvl = h <= 0 ? 'overdue' : h <= 2 ? 'critical' : h <= 6 ? 'urgent' : h <= 24 ? 'medium' : 'low'
              const c   = COLORS[lvl]
              return (
                <button key={t.id}
                  className={`switcher-item${t.id === task.id ? ' active' : ''}`}
                  style={t.id === task.id ? { borderColor: c, background: c + '10' } : {}}
                  onClick={() => setSelId(t.id)} role="listitem" aria-current={t.id === task.id}>
                  <div className="switcher-dot" style={{ background: c }} />
                  <div className="switcher-info">
                    <div className="switcher-title">{t.title.slice(0,24)}{t.title.length > 24 ? '…' : ''}</div>
                    <div className="switcher-time" style={{ color: c }}>
                      {h <= 0 ? 'OVERDUE' : h < 1 ? `${Math.round(h*60)}m` : `${h.toFixed(1)}h`}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default FocusMode
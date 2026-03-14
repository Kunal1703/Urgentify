import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTaskContext } from '../App.jsx'
import { useSingleTaskPressure } from '../hooks/useDeadlinePressure'
import { useConfetti } from '../hooks/useConfetti'
import { useSound } from '../hooks/useSound'
import PressureBar from '../components/PressureBar.jsx'

const COLORS = { low:'var(--green)', medium:'var(--yellow)', urgent:'var(--orange)', critical:'var(--red)', overdue:'var(--red)' }
const HEX    = { low:'#00ff88', medium:'#ffd60a', urgent:'#ff8c00', critical:'#ff2d55', overdue:'#ff2d55' }

const POMO_MODES = {
  work:       { label:'FOCUS',       duration:25*60, color:'var(--green)' },
  shortBreak: { label:'SHORT BREAK', duration: 5*60, color:'var(--yellow)' },
  longBreak:  { label:'LONG BREAK',  duration:15*60, color:'var(--orange)' },
}

// ── Circular timer ring ───────────────────────────────────────
function TimerRing({ seconds, total, color, hexColor, children }) {
  const R    = 110
  const circ = 2 * Math.PI * R
  const pct  = 1 - seconds / total
  const dash = circ * pct

  return (
    <div className="focus-ring-wrapper">
      <svg className="focus-ring-svg" viewBox="0 0 260 260">
        {/* Outer glow track */}
        <circle cx="130" cy="130" r={R+8} fill="none"
          stroke={hexColor} strokeWidth="1" opacity="0.12" />
        {/* Track */}
        <circle cx="130" cy="130" r={R} fill="none"
          stroke="var(--border)" strokeWidth="8" />
        {/* Progress */}
        <circle cx="130" cy="130" r={R} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - dash}
          transform="rotate(-90 130 130)"
          style={{ transition:'stroke-dashoffset 0.9s ease, stroke 0.5s ease',
            filter:`drop-shadow(0 0 12px ${hexColor})` }}
        />
        {/* Tick marks */}
        {Array.from({length:60},(_,i) => {
          const a  = (i/60)*Math.PI*2 - Math.PI/2
          const r1 = i%5===0 ? R-16 : R-10
          const r2 = R+2
          return (
            <line key={i}
              x1={130+r1*Math.cos(a)} y1={130+r1*Math.sin(a)}
              x2={130+r2*Math.cos(a)} y2={130+r2*Math.sin(a)}
              stroke={hexColor} strokeWidth={i%5===0?2:0.8}
              opacity={i%5===0?0.5:0.2}
            />
          )
        })}
      </svg>
      <div className="focus-ring-inner">
        {children}
      </div>
    </div>
  )
}

// ── Pomodoro inside focus ─────────────────────────────────────
function Pomodoro() {
  const [mode, setMode]       = useState('work')
  const [secs, setSecs]       = useState(POMO_MODES.work.duration)
  const [running, setRunning] = useState(false)
  const [done, setDone]       = useState(0)
  const [round, setRound]     = useState(1)
  const ref                   = useRef(null)
  const { fire }              = useConfetti()
  const { playPomoDone }      = useSound()
  const cur = POMO_MODES[mode]

  const switchMode = useCallback((m) => {
    clearInterval(ref.current)
    setMode(m); setSecs(POMO_MODES[m].duration); setRunning(false)
  }, [])

  useEffect(() => {
    if (!running) { clearInterval(ref.current); return }
    ref.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(ref.current); setRunning(false)
          if (mode === 'work') {
            fire(); playPomoDone(); setDone(c=>c+1)
            const nr=round+1; setRound(nr)
            switchMode(nr%4===0 ? 'longBreak' : 'shortBreak')
          } else switchMode('work')
          return 0
        }
        return s-1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [running, mode, round, switchMode, fire, playPomoDone])

  const mm = String(Math.floor(secs/60)).padStart(2,'0')
  const ss = String(secs%60).padStart(2,'0')
  const hexColors = { 'var(--green)':'#00ff88', 'var(--yellow)':'#ffd60a', 'var(--orange)':'#ff8c00' }
  const hexColor  = hexColors[cur.color] || '#00ff88'

  return (
    <div className="pomodoro-widget pomo-cinematic">
      <div className="pomo-header">
        <span className="pomo-title">POMODORO</span>
        <div className="pomo-rounds">
          {Array.from({length:4},(_,i)=>(
            <span key={i} className="pomo-round-dot"
              style={{background: i<(done%4) ? cur.color : 'var(--border)'}} />
          ))}
        </div>
      </div>
      <div className="pomo-modes">
        {Object.entries(POMO_MODES).map(([key,val])=>(
          <button key={key}
            className={`pomo-mode-btn${mode===key?' active':''}`}
            style={mode===key?{borderColor:val.color,color:val.color}:{}}
            onClick={()=>switchMode(key)}>{val.label}</button>
        ))}
      </div>
      <TimerRing seconds={secs} total={cur.duration} color={cur.color} hexColor={hexColor}>
        <div className="pomo-time" style={{color:cur.color}}>{mm}:{ss}</div>
        <div className="pomo-mode-label" style={{color:cur.color}}>{cur.label}</div>
      </TimerRing>
      <div className="pomo-controls">
        <button className="pomo-btn pomo-reset" onClick={()=>{setSecs(cur.duration);setRunning(false)}}>↺</button>
        <button className={`pomo-btn pomo-play${running?' running':''}`}
          style={{background:cur.color,color:'var(--bg-primary)'}}
          onClick={()=>setRunning(r=>!r)}>
          {running?'⏸ PAUSE':'▶ START'}
        </button>
        <button className="pomo-btn pomo-skip"
          onClick={()=>switchMode(mode==='work'?'shortBreak':'work')}>⏭</button>
      </div>
      <div className="pomo-session-count">
        <span className="pomo-session-label">SESSIONS DONE</span>
        <span className="pomo-session-val" style={{color:cur.color}}>{done}</span>
      </div>
    </div>
  )
}

// ── Main FocusMode ────────────────────────────────────────────
function FocusMode() {
  const { id }                  = useParams()
  const navigate                = useNavigate()
  const { tasks, completeTask } = useTaskContext()
  const { fire }                = useConfetti()
  const { playComplete }        = useSound()
  const [selId, setSelId]       = useState(id||null)
  const [completing, setComp]   = useState(false)
  const [entered, setEntered]   = useState(false)

  const sorted = [...tasks].sort((a,b)=>new Date(a.deadline)-new Date(b.deadline))
  const task   = selId ? tasks.find(t=>t.id===selId) : sorted[0]
  const p      = useSingleTaskPressure(task)

  useEffect(()=>{ if(!selId&&sorted.length>0) setSelId(sorted[0].id) },[tasks.length])
  // Cinematic entrance
  useEffect(()=>{ const t=setTimeout(()=>setEntered(true),80); return ()=>clearTimeout(t) },[])

  const handleComplete = () => {
    setComp(true); fire(); playComplete()
    setTimeout(()=>{ completeTask(task.id); navigate('/') }, 1400)
  }

  if (tasks.length===0) return (
    <div className="focus-empty">
      <div className="focus-empty-icon">◎</div>
      <div>NO ACTIVE TASKS</div>
      <button className="focus-empty-add" onClick={()=>navigate('/add')}>+ ADD TASK</button>
    </div>
  )

  if (!task||!p) return null
  const color    = COLORS[p.urgencyLevel]
  const hexColor = HEX[p.urgencyLevel]

  // Seconds remaining for the ring (clamp to 24h max for visual)
  const secsRemaining  = Math.max(0, (new Date(task.deadline)-new Date())/1000)
  const secsTotal      = Math.max(1, (new Date(task.deadline)-new Date(task.createdAt))/1000)

  return (
    <div className={`focus-mode focus-cinematic${entered?' focus-entered':''}${completing?' completing':''}`}>
      {/* Cinematic ambient background */}
      <div className="focus-ambient" style={{background:`radial-gradient(ellipse at 50% 30%, ${hexColor}08 0%, transparent 70%)`}} />
      <div className="focus-ambient-ring" style={{borderColor:`${hexColor}15`}} />

      <button className="focus-back" onClick={()=>navigate('/')}>← EXIT FOCUS</button>

      <div className="focus-layout focus-layout-3col">
        {/* LEFT — Pomodoro */}
        <div className="focus-sidebar-left">
          <Pomodoro />
        </div>

        {/* CENTER — Cinematic task panel */}
        <div className="focus-main focus-main-cinematic">
          <div className="focus-urgency" style={{color}}>
            <span className={`focus-urgency-dot${p.urgencyLevel==='critical'?' blink':''}`} style={{background:color}} />
            {p.urgencyLevel.toUpperCase()} PRIORITY
          </div>

          {/* Glowing Timer Ring */}
          <TimerRing seconds={Math.min(secsRemaining, 86400)} total={Math.min(secsTotal, 86400)} color={color} hexColor={hexColor}>
            <div className={`focus-countdown${p.urgencyLevel==='critical'?' critical-shake':''}`}
              style={{color, fontSize:'clamp(22px,3.5vw,42px)', letterSpacing:'2px'}}
              role="timer">
              {p.countdown.display}
            </div>
            <div className="focus-countdown-label">TIME REMAINING</div>
            {/* Breathing animation dot */}
            <div className="focus-breathing-dot" style={{background:color}} />
          </TimerRing>

          <h1 className={`focus-title${completing?' focus-title-complete':''}`}>{task.title}</h1>
          {task.description && <p className="focus-description">{task.description}</p>}

          <div className="focus-meta">
            <div className="focus-meta-item">
              <span className="focus-meta-label">CATEGORY</span>
              <span style={{color}}>{task.category?.toUpperCase()}</span>
            </div>
            <div className="focus-meta-divider"/>
            <div className="focus-meta-item">
              <span className="focus-meta-label">DEADLINE</span>
              <span>{new Date(task.deadline).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
            </div>
            {task.estimatedHours&&(<>
              <div className="focus-meta-divider"/>
              <div className="focus-meta-item">
                <span className="focus-meta-label">ESTIMATED</span>
                <span>{task.estimatedHours}h</span>
              </div>
            </>)}
          </div>

          {p.feasibility&&task.estimatedHours&&(
            <div className="focus-feasibility" style={{borderColor:p.feasibility.color+'44'}}>
              <div className="focus-feasibility-row">
                <span className="focus-feas-label">WORK REQUIRED</span>
                <span className="focus-feas-value" style={{color}}>{task.estimatedHours}h</span>
              </div>
              <div className="focus-feasibility-row">
                <span className="focus-feas-label">TIME AVAILABLE</span>
                <span className="focus-feas-value" style={{color}}>{Math.max(0,p.hoursRemaining).toFixed(1)}h</span>
              </div>
              <div className="focus-feasibility-row">
                <span className="focus-feas-label">VERDICT</span>
                <span className="focus-feas-value" style={{color:p.feasibility.color}}>{p.feasibility.label}</span>
              </div>
            </div>
          )}

          <div className="focus-pressure">
            <PressureBar percent={p.pressurePercent} urgencyLevel={p.urgencyLevel} height={8} showLabel />
          </div>

          <div className="focus-actions">
            <button className={`focus-done-btn${completing?' completing':''}`}
              onClick={handleComplete} disabled={completing}
              style={{boxShadow: completing ? `0 0 30px var(--green)` : `0 0 20px ${hexColor}44`}}>
              {completing ? '🎉 COMPLETED!' : '✓ MARK COMPLETE'}
            </button>
            <button className="focus-next-btn"
              disabled={sorted.findIndex(t=>t.id===task.id)>=sorted.length-1}
              onClick={()=>{const idx=sorted.findIndex(t=>t.id===task.id);if(idx<sorted.length-1)setSelId(sorted[idx+1].id)}}>
              NEXT TASK →
            </button>
          </div>
        </div>

        {/* RIGHT — Task switcher */}
        <aside className="focus-switcher">
          <div className="switcher-header">SWITCH TASK</div>
          <div className="switcher-list" role="list">
            {sorted.map(t=>{
              const h=  (new Date(t.deadline)-new Date())/3600000
              const lvl=h<=0?'overdue':h<=2?'critical':h<=6?'urgent':h<=24?'medium':'low'
              const c=  COLORS[lvl]
              return (
                <button key={t.id}
                  className={`switcher-item${t.id===task.id?' active':''}`}
                  style={t.id===task.id?{borderColor:c,background:c+'10'}:{}}
                  onClick={()=>setSelId(t.id)} role="listitem">
                  <div className="switcher-dot" style={{background:c}}/>
                  <div className="switcher-info">
                    <div className="switcher-title">{t.title.slice(0,24)}{t.title.length>24?'…':''}</div>
                    <div className="switcher-time" style={{color:c}}>
                      {h<=0?'OVERDUE':h<1?`${Math.round(h*60)}m`:`${h.toFixed(1)}h`}
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
import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PressureBar from './PressureBar.jsx'
import CountdownTimer from './CountdownTimer.jsx'
import { useSingleTaskPressure } from '../hooks/useDeadlinePressure'
import { useTaskContext } from '../App.jsx'
import { useSound } from '../hooks/useSound.js'
import { useConfetti } from '../hooks/useConfetti.js'

const CAT_ICONS  = { Work:'◈', Study:'◉', Personal:'◎', Health:'◌', Other:'◇' }
const PRI_LABELS = { critical:'■ CRITICAL', urgent:'▲ URGENT', medium:'● MEDIUM', low:'○ LOW', overdue:'✕ OVERDUE' }
const COLORS     = { low:'var(--green)', medium:'var(--yellow)', urgent:'var(--orange)', critical:'var(--red)', overdue:'var(--red)' }

function TaskCard({ task, index = 0 }) {
  const navigate                       = useNavigate()
  const { completeTask, deleteTask, updateTask } = useTaskContext()
  const p                              = useSingleTaskPressure(task)
  const { playComplete, playCritical } = useSound()
  const { fire }                       = useConfetti()
  const [confirm, setConfirm]          = useState(false)
  const [showTags, setShowTags]        = useState(false)
  const [newTag, setNewTag]            = useState('')
  // Completion sequence: idle → glowing → check → done
  const [compStage, setCompStage]      = useState('idle')
  const cardRef                        = useRef(null)

  if (!p) return null
  const color    = COLORS[p.urgencyLevel]
  const progress = task.progress ?? 0
  const tags     = task.tags ?? []

  // Full animated completion sequence
  const handleComplete = () => {
    if (compStage !== 'idle') return
    setCompStage('glowing')
    playComplete()
    setTimeout(() => setCompStage('check'), 400)
    setTimeout(() => { fire(); setCompStage('fadeout') }, 800)
    setTimeout(() => completeTask(task.id), 1300)
  }

  const handleProgress = (val) => {
    updateTask(task.id, { progress: Number(val) })
    if (Number(val) === 100) { playComplete(); fire() }
  }

  const addTag = (e) => {
    e.preventDefault()
    const tag = newTag.trim().replace(/^#/, '')
    if (!tag || tags.includes(tag)) { setNewTag(''); return }
    updateTask(task.id, { tags: [...tags, tag] })
    setNewTag('')
  }

  const removeTag = (tag) => updateTask(task.id, { tags: tags.filter(t => t !== tag) })

  const compClass = compStage === 'glowing'  ? ' card-completing-glow'
                  : compStage === 'check'    ? ' card-completing-check'
                  : compStage === 'fadeout'  ? ' card-completing-fade'
                  : ''

  return (
    <article
      ref={cardRef}
      className={`task-card task-card-${p.urgencyLevel} task-card-hoverable${compClass}`}
      style={{ animationDelay:`${index*0.07}s`, '--urgency-color': color, '--card-index': index }}
      aria-label={`Task: ${task.title}`}
    >
      {/* Glow border overlay on hover */}
      <div className="card-glow-border" style={{ '--glow-color': color }} />

      {/* Completion check overlay */}
      {compStage === 'check' && (
        <div className="card-check-overlay">
          <span className="card-check-icon" style={{ color: 'var(--green)' }}>✓</span>
        </div>
      )}

      <div className="task-card-accent" style={{ background: color }} />

      <div className="task-card-inner">
        {/* Header */}
        <div className="task-card-header">
          <div className="task-meta">
            <span className="task-category" style={{ color }}>
              {CAT_ICONS[task.category] || '◇'} {task.category?.toUpperCase()}
            </span>
            <span className={`task-priority priority-${p.urgencyLevel}`} style={{ boxShadow:`0 0 8px ${color}44` }}>
              {PRI_LABELS[p.urgencyLevel]}
            </span>
          </div>
          <CountdownTimer task={task} size="small" />
        </div>

        <h3 className="task-title">{task.title}</h3>
        {task.description && <p className="task-description">{task.description}</p>}

        {/* Tags */}
        <div className="task-tags-row">
          {tags.map(tag => (
            <span key={tag} className="task-tag" style={{ borderColor: color+'66', color }}>
              #{tag}
              <button className="tag-remove" onClick={() => removeTag(tag)}>×</button>
            </span>
          ))}
          <button className="tag-add-btn" onClick={() => setShowTags(s => !s)}>
            {showTags ? '✕' : '# +'}
          </button>
          {showTags && (
            <form onSubmit={addTag} className="tag-input-form">
              <input className="tag-input" placeholder="tag name"
                value={newTag} onChange={e => setNewTag(e.target.value)}
                maxLength={20} autoFocus />
            </form>
          )}
        </div>

        {/* Progress slider */}
        <div className="task-progress-wrapper">
          <div className="task-progress-header">
            <span className="task-progress-label">PROGRESS</span>
            <span className="task-progress-val"
              style={{ color: progress===100 ? 'var(--green)' : color }}>
              {progress}%{progress===100 ? ' ✓' : ''}
            </span>
          </div>
          <input type="range" className="task-progress-slider"
            min="0" max="100" step="5" value={progress}
            onChange={e => handleProgress(e.target.value)}
            style={{
              '--slider-color': color,
              background: `linear-gradient(to right, ${color} 0%, ${color} ${progress}%, var(--border) ${progress}%, var(--border) 100%)`
            }}
            aria-label={`Progress: ${progress}%`}
          />
          <div className="task-progress-track-labels">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        {/* Time estimation */}
        {task.estimatedHours && (
          <div className="task-estimate">
            <span className="estimate-item">
              <span className="estimate-label">EST</span>
              <span style={{ color }}>{task.estimatedHours}h</span>
            </span>
            <span className="estimate-divider">·</span>
            <span className="estimate-item">
              <span className="estimate-label">LEFT</span>
              <span style={{ color }}>{p.timeRemaining}</span>
            </span>
            {p.feasibility && (
              <>
                <span className="estimate-divider">·</span>
                <span className="estimate-feasibility" style={{ color: p.feasibility.color }}>
                  {p.feasibility.label}
                </span>
              </>
            )}
          </div>
        )}

        {/* Alive pressure bar */}
        <div className="task-pressure">
          <PressureBar percent={p.pressurePercent} urgencyLevel={p.urgencyLevel} height={4} />
        </div>

        {/* Actions — slide up on hover */}
        <div className="task-actions card-actions-animated">
          <button className="action-btn action-focus"
            style={{ '--btn-glow': color }}
            onClick={() => navigate(`/focus/${task.id}`)}>
            ◎ FOCUS
          </button>
          {!confirm ? (
            <>
              <button className="action-btn action-complete"
                onClick={handleComplete} disabled={compStage !== 'idle'}>
                ✓ DONE
              </button>
              <button className="action-btn action-delete" onClick={() => setConfirm(true)}>✕</button>
            </>
          ) : (
            <div className="confirm-row">
              <span className="confirm-label">DELETE?</span>
              <button className="action-btn action-confirm-yes" onClick={() => deleteTask(task.id)}>YES</button>
              <button className="action-btn action-confirm-no" onClick={() => setConfirm(false)}>NO</button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default TaskCard
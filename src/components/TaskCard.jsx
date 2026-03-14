import React, { useState } from 'react'
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

const TAG_COLORS = [
  '#00ff88','#ffd60a','#ff8c00','#ff2d55','#00d4ff','#a855f7','#f97316','#06b6d4'
]

function TaskCard({ task, index = 0, dragHandleProps = {} }) {
  const navigate                    = useNavigate()
  const { completeTask, deleteTask, updateTask } = useTaskContext()
  const p                           = useSingleTaskPressure(task)
  const { playComplete, playCritical } = useSound()
  const { fire }                    = useConfetti()
  const [confirm, setConfirm]       = useState(false)
  const [showTags, setShowTags]     = useState(false)
  const [newTag, setNewTag]         = useState('')
  const [completing, setCompleting] = useState(false)

  if (!p) return null
  const color = COLORS[p.urgencyLevel]
  const progress = task.progress ?? 0
  const tags = task.tags ?? []

  const handleComplete = () => {
    setCompleting(true)
    playComplete()
    fire()
    setTimeout(() => completeTask(task.id), 600)
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

  const removeTag = (tag) => {
    updateTask(task.id, { tags: tags.filter(t => t !== tag) })
  }

  // Alert sound for critical tasks on hover
  const handleMouseEnter = () => {
    if (p.urgencyLevel === 'critical') playCritical()
  }

  return (
    <article
      className={`task-card task-card-${p.urgencyLevel}${completing ? ' completing' : ''}`}
      style={{ animationDelay: `${index * 0.05}s`, '--urgency-color': color }}
      aria-label={`Task: ${task.title}, urgency: ${p.urgencyLevel}`}
      onMouseEnter={handleMouseEnter}
    >
      {/* Drag handle */}
      <div className="task-drag-handle" {...dragHandleProps} title="Drag to reorder">
        <span>⋮⋮</span>
      </div>

      <div className="task-card-accent" style={{ background: color }} />

      <div className="task-card-inner">
        {/* Header */}
        <div className="task-card-header">
          <div className="task-meta">
            <span className="task-category" style={{ color }}>
              {CAT_ICONS[task.category] || '◇'} {task.category?.toUpperCase()}
            </span>
            <span className={`task-priority priority-${p.urgencyLevel}`}>
              {PRI_LABELS[p.urgencyLevel]}
            </span>
          </div>
          <CountdownTimer task={task} size="small" />
        </div>

        {/* Title + description */}
        <h3 className="task-title">{task.title}</h3>
        {task.description && <p className="task-description">{task.description}</p>}

        {/* Tags */}
        <div className="task-tags-row">
          {tags.map(tag => (
            <span key={tag} className="task-tag" style={{ borderColor: color + '66', color }}>
              #{tag}
              <button className="tag-remove" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>×</button>
            </span>
          ))}
          <button className="tag-add-btn" onClick={() => setShowTags(s => !s)} aria-label="Add tag">
            {showTags ? '✕' : '# +'}
          </button>
          {showTags && (
            <form onSubmit={addTag} className="tag-input-form">
              <input
                className="tag-input"
                placeholder="tag name"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </form>
          )}
        </div>

        {/* Progress slider */}
        <div className="task-progress-wrapper">
          <div className="task-progress-header">
            <span className="task-progress-label">PROGRESS</span>
            <span className="task-progress-val" style={{ color: progress === 100 ? 'var(--green)' : color }}>
              {progress}%{progress === 100 ? ' ✓' : ''}
            </span>
          </div>
          <input
            type="range"
            className="task-progress-slider"
            min="0" max="100" step="5"
            value={progress}
            onChange={e => handleProgress(e.target.value)}
            style={{
              '--slider-color': color,
              background: `linear-gradient(to right, ${color} 0%, ${color} ${progress}%, var(--border) ${progress}%, var(--border) 100%)`
            }}
            aria-label={`Task progress: ${progress}%`}
          />
          <div className="task-progress-track-labels">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        {/* Time estimation */}
        {task.estimatedHours && (
          <div className="task-estimate">
            <span className="estimate-item">
              <span className="estimate-label">ESTIMATED</span>
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

        {/* Pressure bar */}
        <div className="task-pressure">
          <PressureBar percent={p.pressurePercent} urgencyLevel={p.urgencyLevel} height={3} />
        </div>

        {/* Actions */}
        <div className="task-actions">
          <button className="action-btn action-focus" onClick={() => navigate(`/focus/${task.id}`)}>
            ◎ FOCUS
          </button>
          {!confirm ? (
            <>
              <button className="action-btn action-complete" onClick={handleComplete}>
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
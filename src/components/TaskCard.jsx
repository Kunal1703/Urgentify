import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PressureBar from './PressureBar.jsx'
import CountdownTimer from './CountdownTimer.jsx'
import { useSingleTaskPressure } from '../hooks/useDeadlinePressure'
import { useTaskContext } from '../App.jsx'

const CAT_ICONS = { Work:'◈', Study:'◉', Personal:'◎', Health:'◌', Other:'◇' }
const PRI_LABELS = { critical:'■ CRITICAL', urgent:'▲ URGENT', medium:'● MEDIUM', low:'○ LOW', overdue:'✕ OVERDUE' }
const COLORS = { low:'var(--green)', medium:'var(--yellow)', urgent:'var(--orange)', critical:'var(--red)', overdue:'var(--red)' }

function TaskCard({ task, index = 0 }) {
  const navigate = useNavigate()
  const { completeTask, deleteTask } = useTaskContext()
  const p = useSingleTaskPressure(task)
  const [confirm, setConfirm] = useState(false)

  if (!p) return null
  const color = COLORS[p.urgencyLevel]

  return (
    <article
      className={`task-card task-card-${p.urgencyLevel}`}
      style={{ animationDelay: `${index * 0.05}s`, '--urgency-color': color }}
      aria-label={`Task: ${task.title}, urgency: ${p.urgencyLevel}`}
    >
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
              <button className="action-btn action-complete" onClick={() => completeTask(task.id)}>
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
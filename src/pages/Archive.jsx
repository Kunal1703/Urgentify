import React, { useState } from 'react'
import { useTaskContext } from '../App.jsx'

function Archive() {
  const { archivedTasks } = useTaskContext()
  const [search, setSearch] = useState('')

  const filtered = archivedTasks
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))

  const totalHours = archivedTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const onTime = archivedTasks.filter(t => new Date(t.completedAt) <= new Date(t.deadline)).length

  return (
    <div className="archive-page">
      <div className="archive-header">
        <div>
          <h1 className="archive-title">ARCHIVE</h1>
          <p className="archive-sub">COMPLETED MISSIONS</p>
        </div>
        <div className="archive-stats">
          <div className="archive-stat">
            <span className="archive-stat-val" style={{ color:'var(--green)' }}>{archivedTasks.length}</span>
            <span className="archive-stat-label">COMPLETED</span>
          </div>
          <div className="archive-stat">
            <span className="archive-stat-val" style={{ color:'var(--yellow)' }}>{totalHours.toFixed(1)}h</span>
            <span className="archive-stat-label">TOTAL WORK</span>
          </div>
          <div className="archive-stat">
            <span className="archive-stat-val" style={{ color:'var(--green)' }}>
              {archivedTasks.length > 0 ? Math.round((onTime / archivedTasks.length) * 100) : 0}%
            </span>
            <span className="archive-stat-label">ON TIME</span>
          </div>
        </div>
      </div>

      <div className="archive-search-wrapper">
        <span className="search-icon">⌕</span>
        <input
          type="search" className="archive-search"
          placeholder="Search completed tasks..."
          value={search} onChange={e => setSearch(e.target.value)}
          aria-label="Search archived tasks"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="archive-empty">
          <div className="archive-empty-icon">▣</div>
          <div>{search ? 'NO RESULTS FOUND' : 'NO COMPLETED TASKS YET'}</div>
          <div className="archive-empty-sub">Complete tasks to see them here</div>
        </div>
      ) : (
        <div className="archive-list" role="list">
          {filtered.map((task, i) => <ArchiveCard key={task.id} task={task} index={i} />)}
        </div>
      )}
    </div>
  )
}

function ArchiveCard({ task, index }) {
  const completed = new Date(task.completedAt)
  const deadline  = new Date(task.deadline)
  const onTime    = completed <= deadline
  const diff      = (deadline - completed) / 3600000

  return (
    <div className="archive-card" style={{ animationDelay: `${index * 0.04}s` }} role="listitem">
      <div className="archive-card-check" style={{ color: onTime ? 'var(--green)' : 'var(--orange)' }}>✓</div>
      <div className="archive-card-body">
        <div className="archive-card-header">
          <h3 className="archive-card-title">{task.title}</h3>
          <span className="archive-timing" style={{ color: onTime ? 'var(--green)' : 'var(--orange)' }}>
            {onTime ? `${diff.toFixed(1)}h EARLY` : `${Math.abs(diff).toFixed(1)}h LATE`}
          </span>
        </div>
        <div className="archive-card-meta">
          <span className="archive-cat">{task.category}</span>
          <span className="archive-sep">·</span>
          <span>
            Completed {completed.toLocaleDateString('en-US',{ month:'short', day:'numeric' })} at{' '}
            {completed.toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit' })}
          </span>
          {task.estimatedHours && <><span className="archive-sep">·</span><span>{task.estimatedHours}h est.</span></>}
        </div>
        {task.description && <p className="archive-desc">{task.description}</p>}
      </div>
    </div>
  )
}

export default Archive
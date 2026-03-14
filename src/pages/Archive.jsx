import React, { useState } from 'react'
import { useTaskContext } from '../App.jsx'

// ── Productivity Score Algorithm ──────────────────────────────
// Score 0–100 based on:
//   40pts — On time completion
//   25pts — Progress reached 100%
//   20pts — Completed early (bonus based on how early)
//   15pts — Priority weight (critical=15, urgent=10, medium=5, low=2)
function calcProductivityScore(task) {
  const completed = new Date(task.completedAt)
  const deadline  = new Date(task.deadline)
  const created   = new Date(task.createdAt)
  const totalTime = deadline - created
  const timeLeft  = deadline - completed
  let score = 0

  // 1. On-time (40pts)
  if (completed <= deadline) {
    score += 40
    // 2. Early bonus (20pts) — proportional to how early
    const earlyRatio = Math.min(1, timeLeft / (totalTime || 1))
    score += Math.round(earlyRatio * 20)
  } else {
    // Late penalty — partial score based on how late
    const lateMs    = completed - deadline
    const lateRatio = Math.min(1, lateMs / (totalTime || 1))
    score += Math.round((1 - lateRatio) * 15)
  }

  // 3. Progress 100% (25pts)
  if ((task.progress ?? 0) >= 100) score += 25

  // 4. Priority weight (15pts)
  const priScore = { critical:15, urgent:10, medium:5, low:2 }
  score += priScore[task.priority] || 2

  return Math.min(100, Math.max(0, score))
}

function getScoreLabel(score) {
  if (score >= 90) return { label: 'EXCEPTIONAL', color: '#00ff88' }
  if (score >= 75) return { label: 'EXCELLENT',   color: '#00cc6a' }
  if (score >= 60) return { label: 'GOOD',         color: '#ffd60a' }
  if (score >= 40) return { label: 'AVERAGE',      color: '#ff8c00' }
  return               { label: 'NEEDS WORK',      color: '#ff2d55' }
}

function ScoreRing({ score, color }) {
  const R    = 22
  const circ = 2 * Math.PI * R
  const dash = circ * (1 - score / 100)
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-label={`Score: ${score}`}>
      <circle cx="28" cy="28" r={R} fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle cx="28" cy="28" r={R} fill="none"
        stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={dash}
        transform="rotate(-90 28 28)"
        style={{ transition:'stroke-dashoffset 1s ease', filter:`drop-shadow(0 0 4px ${color}88)` }}
      />
      <text x="28" y="32" textAnchor="middle"
        fill={color} fontSize="11" fontFamily="'Space Mono',monospace" fontWeight="700">
        {score}
      </text>
    </svg>
  )
}

function Archive() {
  const { archivedTasks } = useTaskContext()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date' | 'score'

  const withScores = archivedTasks.map(t => ({
    ...t,
    productivityScore: calcProductivityScore(t),
  }))

  const filtered = withScores
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'score'
      ? b.productivityScore - a.productivityScore
      : new Date(b.completedAt) - new Date(a.completedAt)
    )

  const totalHours  = archivedTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const onTime      = archivedTasks.filter(t => new Date(t.completedAt) <= new Date(t.deadline)).length
  const avgScore    = withScores.length > 0
    ? Math.round(withScores.reduce((s, t) => s + t.productivityScore, 0) / withScores.length)
    : 0
  const scoreLabel  = getScoreLabel(avgScore)

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
          {/* Overall Productivity Score */}
          <div className="archive-stat archive-stat-score">
            <ScoreRing score={avgScore} color={scoreLabel.color} />
            <span className="archive-stat-label">AVG SCORE</span>
            <span className="archive-score-label" style={{ color: scoreLabel.color }}>
              {scoreLabel.label}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="archive-controls">
        <div className="archive-search-wrapper">
          <span className="search-icon">⌕</span>
          <input type="search" className="archive-search"
            placeholder="Search completed tasks..."
            value={search} onChange={e => setSearch(e.target.value)}
            aria-label="Search archived tasks" />
        </div>
        <div className="archive-sort">
          <button className={`sort-btn${sortBy==='date'?' active':''}`} onClick={() => setSortBy('date')}>
            DATE
          </button>
          <button className={`sort-btn${sortBy==='score'?' active':''}`} onClick={() => setSortBy('score')}>
            ★ SCORE
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="archive-empty">
          <div className="archive-empty-icon">▣</div>
          <div>{search ? 'NO RESULTS FOUND' : 'NO COMPLETED TASKS YET'}</div>
          <div className="archive-empty-sub">Complete tasks to see your productivity score</div>
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
  const completed  = new Date(task.completedAt)
  const deadline   = new Date(task.deadline)
  const onTime     = completed <= deadline
  const diff       = (deadline - completed) / 3600000
  const score      = task.productivityScore
  const scoreInfo  = getScoreLabel(score)

  return (
    <div className="archive-card" style={{ animationDelay:`${index*0.04}s` }} role="listitem">
      {/* Score ring */}
      <div className="archive-score-ring">
        <ScoreRing score={score} color={scoreInfo.color} />
      </div>

      <div className="archive-card-body">
        <div className="archive-card-header">
          <h3 className="archive-card-title">{task.title}</h3>
          <div className="archive-card-right">
            <span className="archive-score-badge" style={{ color: scoreInfo.color, borderColor: scoreInfo.color+'44' }}>
              {scoreInfo.label}
            </span>
            <span className="archive-timing" style={{ color: onTime?'var(--green)':'var(--orange)' }}>
              {onTime ? `${diff.toFixed(1)}h EARLY` : `${Math.abs(diff).toFixed(1)}h LATE`}
            </span>
          </div>
        </div>

        <div className="archive-card-meta">
          <span className="archive-cat">{task.category}</span>
          <span className="archive-sep">·</span>
          <span>
            {completed.toLocaleDateString('en-US',{month:'short',day:'numeric'})} at{' '}
            {completed.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
          </span>
          {task.estimatedHours && <><span className="archive-sep">·</span><span>{task.estimatedHours}h est.</span></>}
          {task.progress >= 100 && <><span className="archive-sep">·</span><span style={{color:'var(--green)'}}>100% done</span></>}
        </div>

        {/* Score breakdown bar */}
        <div className="archive-score-bar-wrapper">
          <div className="archive-score-bar" style={{ width:`${score}%`, background: scoreInfo.color,
            boxShadow:`0 0 8px ${scoreInfo.color}66` }} />
        </div>

        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="archive-tags">
            {task.tags.map(tag => (
              <span key={tag} className="archive-tag">#{tag}</span>
            ))}
          </div>
        )}

        {task.description && <p className="archive-desc">{task.description}</p>}
      </div>
    </div>
  )
}

export default Archive
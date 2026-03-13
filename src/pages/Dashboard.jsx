import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskContext } from '../App.jsx'
import { useDeadlinePressure } from '../hooks/useDeadlinePressure'
import TaskCard from '../components/TaskCard.jsx'
import UrgencyRadar from '../components/UrgencyRadar.jsx'
import { buildWeekHeatmap } from '../utils/timecalculator'

function Dashboard() {
  const { tasks } = useTaskContext()
  const { sortedTasks, collisions, criticalCount, overdueCount } = useDeadlinePressure(tasks)
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const heatmap = buildWeekHeatmap(tasks)
  const maxStress = Math.max(...heatmap.map(d => d.stress), 1)

  const filtered = sortedTasks.filter(t => {
    if (filter === 'all') return true
    if (filter === 'critical') return t.urgencyLevel === 'critical' || t.urgencyLevel === 'overdue'
    return t.urgencyLevel === filter
  })

  return (
    <div className="dashboard">

      {/* Collision Banner */}
      {collisions.length > 0 && (
        <div className="collision-banner" role="alert" aria-live="polite">
          <div className="collision-icon">⚠</div>
          <div className="collision-info">
            <span className="collision-title">DEADLINE COLLISION DETECTED</span>
            <span className="collision-detail">
              {collisions.map((g, i) => <span key={i}>{g.length} tasks due within 4h · </span>)}
            </span>
          </div>
          <div className="collision-tasks">
            {collisions[0]?.slice(0, 3).map(t => (
              <button key={t.id} className="collision-task-chip" onClick={() => navigate(`/focus/${t.id}`)}>
                {t.title.slice(0, 20)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stat-row">
        <StatCard label="TOTAL"      value={tasks.length}   sub="active tasks"     color="var(--text-secondary)" />
        <StatCard label="CRITICAL"   value={criticalCount}  sub="< 2 hours"        color="var(--red)"    pulse={criticalCount > 0} />
        <StatCard label="OVERDUE"    value={overdueCount}   sub="past deadline"    color="var(--red)"    blink={overdueCount > 0} />
        <StatCard label="COLLISIONS" value={collisions.length} sub="deadline clusters" color="var(--orange)" />
      </div>

      {/* Grid */}
      <div className="dashboard-grid">
        <section className="task-list-section">
          <div className="section-header">
            <h2 className="section-title">TASK QUEUE</h2>
            <div className="filter-pills">
              {['all','critical','urgent','medium','low'].map(f => (
                <button
                  key={f}
                  className={`filter-pill${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="task-list" role="list" aria-label="Task queue">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◎</div>
                <div className="empty-text">NO TASKS IN THIS RANGE</div>
                <button className="empty-add" onClick={() => navigate('/add')}>+ ADD TASK</button>
              </div>
            ) : (
              filtered.map((t, i) => <TaskCard key={t.id} task={t} index={i} />)
            )}
          </div>
        </section>

        {/* Aside */}
        <aside className="dashboard-aside">
          <UrgencyRadar tasks={tasks} />

          {/* Heatmap */}
          <div className="heatmap-widget">
            <div className="widget-header">
              <span className="widget-title">WEEK STRESS HEATMAP</span>
              <span className="widget-sub">deadline density</span>
            </div>
            <div className="heatmap-grid">
              {heatmap.map(day => {
                const intensity = maxStress > 0 ? day.stress / maxStress : 0
                const bg = intensity > 0.75 ? 'var(--red)'
                         : intensity > 0.5  ? 'var(--orange)'
                         : intensity > 0.25 ? 'var(--yellow)'
                         : intensity > 0    ? 'var(--green)'
                         : 'var(--border)'
                return (
                  <div key={day.label} className="heatmap-day">
                    <div
                      className={`heatmap-bar${day.isToday ? ' today' : ''}`}
                      style={{
                        height: `${Math.max(8, intensity * 80)}px`,
                        background: bg,
                        opacity: intensity === 0 ? 0.3 : 1,
                        boxShadow: intensity > 0.75 ? '0 0 10px rgba(255,45,85,0.3)' : 'none',
                      }}
                      title={`${day.label}: ${day.tasks.length} tasks`}
                    />
                    <span className="heatmap-label">{day.label}</span>
                    {day.tasks.length > 0 && <span className="heatmap-count">{day.tasks.length}</span>}
                  </div>
                )
              })}
            </div>
            <div className="heatmap-legend">
              <span>CALM</span>
              <div className="heatmap-gradient" />
              <span>INTENSE</span>
            </div>
          </div>

          <button className="quick-add-btn" onClick={() => navigate('/add')}>
            <span className="quick-add-icon">+</span>
            <span>NEW TASK</span>
          </button>
        </aside>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color, pulse, blink }) {
  return (
    <div
      className={`stat-card${pulse ? ' pulse' : ''}${blink && value > 0 ? ' blink-border' : ''}`}
      style={{ '--stat-color': color }}
    >
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}

export default Dashboard
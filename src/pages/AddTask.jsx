import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskContext } from '../App.jsx'
import { getFeasibility, getHoursRemaining } from '../utils/timecalculator'

const CATEGORIES = ['Work','Study','Personal','Health','Other']
const PRIORITIES = [
  { value:'low',      label:'○ LOW',      color:'var(--green)' },
  { value:'medium',   label:'● MEDIUM',   color:'var(--yellow)' },
  { value:'urgent',   label:'▲ URGENT',   color:'var(--orange)' },
  { value:'critical', label:'■ CRITICAL', color:'var(--red)' },
]
const DEFAULT = { title:'', description:'', category:'Work', priority:'medium', deadline:'', estimatedHours:'' }

function AddTask() {
  const navigate = useNavigate()
  const { addTask } = useTaskContext()
  const [form, setForm] = useState(DEFAULT)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const hoursLeft = form.deadline ? getHoursRemaining(form.deadline) : null
  const feasibility = form.deadline && form.estimatedHours
    ? getFeasibility(form.deadline, parseFloat(form.estimatedHours)) : null

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: null })) }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'TITLE REQUIRED'
    if (!form.deadline) e.deadline = 'DEADLINE REQUIRED'
    else if (new Date(form.deadline) <= new Date()) e.deadline = 'DEADLINE MUST BE IN FUTURE'
    if (form.estimatedHours && (isNaN(form.estimatedHours) || +form.estimatedHours <= 0))
      e.estimatedHours = 'MUST BE A POSITIVE NUMBER'
    return e
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    addTask({ ...form, estimatedHours: form.estimatedHours ? +form.estimatedHours : null })
    setSubmitted(true)
    setTimeout(() => navigate('/'), 800)
  }

  const nowStr = new Date(Date.now() + 60000).toISOString().slice(0, 16)

  return (
    <div className="add-task-page">
      <div className="add-task-container">
        <div className="add-task-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">← BACK</button>
          <div>
            <h1 className="add-task-title">NEW TASK</h1>
            <p className="add-task-sub">Define the mission. Set the deadline.</p>
          </div>
        </div>

        {submitted ? (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <div className="success-text">TASK LOCKED IN</div>
            <div className="success-sub">Redirecting to dashboard...</div>
          </div>
        ) : (
          <form className="add-task-form" onSubmit={handleSubmit} noValidate aria-label="Add task form">

            <div className="form-group">
              <label className="form-label" htmlFor="title">TASK TITLE *</label>
              <input id="title" type="text"
                className={`form-input${errors.title ? ' error' : ''}`}
                placeholder="What needs to be done?"
                value={form.title} onChange={e => set('title', e.target.value)}
                maxLength={100} aria-required="true" />
              {errors.title && <span className="form-error" role="alert">{errors.title}</span>}
              <span className="form-hint">{form.title.length}/100</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="desc">DESCRIPTION</label>
              <textarea id="desc" className="form-textarea"
                placeholder="Additional context (optional)"
                value={form.description} onChange={e => set('description', e.target.value)}
                rows={3} maxLength={300} />
              <span className="form-hint">{form.description.length}/300</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">CATEGORY</label>
                <div className="pill-group" role="radiogroup">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button"
                      className={`pill-btn${form.category === c ? ' active' : ''}`}
                      onClick={() => set('category', c)} aria-pressed={form.category === c}>
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">PRIORITY</label>
                <div className="pill-group" role="radiogroup">
                  {PRIORITIES.map(p => (
                    <button key={p.value} type="button"
                      className={`pill-btn${form.priority === p.value ? ' active' : ''}`}
                      style={form.priority === p.value ? { borderColor: p.color, color: p.color, background: p.color+'18' } : {}}
                      onClick={() => set('priority', p.value)} aria-pressed={form.priority === p.value}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="deadline">DEADLINE *</label>
                <input id="deadline" type="datetime-local"
                  className={`form-input${errors.deadline ? ' error' : ''}`}
                  value={form.deadline} min={nowStr}
                  onChange={e => set('deadline', e.target.value)} aria-required="true" />
                {errors.deadline && <span className="form-error" role="alert">{errors.deadline}</span>}
                {form.deadline && hoursLeft > 0 && (
                  <span className="form-hint" style={{ color: hoursLeft < 2 ? 'var(--red)' : hoursLeft < 6 ? 'var(--orange)' : 'var(--green)' }}>
                    {hoursLeft < 1 ? `${Math.round(hoursLeft * 60)}m from now` : `${hoursLeft.toFixed(1)}h from now`}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="estimate">ESTIMATED HOURS</label>
                <input id="estimate" type="number"
                  className={`form-input${errors.estimatedHours ? ' error' : ''}`}
                  placeholder="e.g. 2.5" value={form.estimatedHours}
                  min="0.1" max="100" step="0.5"
                  onChange={e => set('estimatedHours', e.target.value)} />
                {errors.estimatedHours && <span className="form-error" role="alert">{errors.estimatedHours}</span>}
                {!errors.estimatedHours && <span className="form-hint">How long will this take?</span>}
              </div>
            </div>

            {feasibility && (
              <div className="feasibility-preview" style={{ borderColor: feasibility.color + '44' }}>
                <span className="feasibility-icon">
                  {feasibility.status === 'impossible' ? '⚠' : feasibility.status === 'tight' ? '⚡' : '✓'}
                </span>
                <div className="feasibility-text">
                  <span className="feasibility-status" style={{ color: feasibility.color }}>{feasibility.label}</span>
                  <span className="feasibility-detail">
                    {form.estimatedHours}h work · {hoursLeft?.toFixed(1)}h available
                    {feasibility.status === 'impossible' && ' — Not enough time!'}
                    {feasibility.status === 'tight'      && ' — Very tight margin'}
                    {feasibility.status === 'ok'         && ' — Should be manageable'}
                    {feasibility.status === 'comfortable'&& ' — Plenty of time'}
                  </span>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>CANCEL</button>
              <button type="submit" className="btn-submit">⬡ LOCK IN TASK</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AddTask
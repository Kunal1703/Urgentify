import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskContext } from '../App.jsx'
import { getUrgencyLevel } from '../utils/timecalculator.js'

const STATIC_COMMANDS = [
  { id: 'nav-dashboard', icon: '⬡', label: 'Go to Dashboard',   category: 'NAVIGATE', action: (nav) => nav('/') },
  { id: 'nav-add',       icon: '+', label: 'Add New Task',       category: 'NAVIGATE', action: (nav) => nav('/add') },
  { id: 'nav-focus',     icon: '◎', label: 'Open Focus Mode',    category: 'NAVIGATE', action: (nav) => nav('/focus') },
  { id: 'nav-archive',   icon: '▣', label: 'View Archive',       category: 'NAVIGATE', action: (nav) => nav('/archive') },
]

function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const { tasks, completeTask } = useTaskContext()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Build dynamic task commands
  const taskCommands = tasks.map(t => ({
    id: `task-${t.id}`,
    icon: '◈',
    label: t.title,
    sub: `Focus → ${t.category}`,
    category: 'TASKS',
    urgency: getUrgencyLevel(t.deadline),
    action: (nav) => { onClose(); nav(`/focus/${t.id}`) },
    completeAction: () => { completeTask(t.id); onClose() },
    taskId: t.id,
  }))

  const allCommands = [...STATIC_COMMANDS, ...taskCommands]

  const filtered = query.trim() === ''
    ? allCommands
    : allCommands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Reset selected when query changes
  useEffect(() => { setSelected(0) }, [query])

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!open) return
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, filtered.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selected]) {
        filtered[selected].action(navigate)
        onClose()
      }
    }
  }, [open, filtered, selected, navigate, onClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selected]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  if (!open) return null

  const URGENCY_COLORS = {
    low: 'var(--green)', medium: 'var(--yellow)',
    urgent: 'var(--orange)', critical: 'var(--red)', overdue: 'var(--red)'
  }

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {})

  // Flat list with group headers for rendering, but track flat index for selection
  const flatItems = filtered

  return (
    <div className="cp-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="cp-modal" onClick={e => e.stopPropagation()}>

        {/* Search input */}
        <div className="cp-search-row">
          <span className="cp-search-icon">⌕</span>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Type a command or search tasks..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search commands"
            autoComplete="off"
            spellCheck="false"
          />
          <span className="cp-esc" onClick={onClose}>ESC</span>
        </div>

        {/* Results */}
        <div className="cp-results" ref={listRef} role="listbox">
          {flatItems.length === 0 ? (
            <div className="cp-empty">No commands found for "{query}"</div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="cp-group">
                <div className="cp-group-label">{category}</div>
                {items.map(cmd => {
                  const flatIdx = flatItems.indexOf(cmd)
                  const isSelected = flatIdx === selected
                  const urgColor = cmd.urgency ? URGENCY_COLORS[cmd.urgency] : 'var(--text-secondary)'
                  return (
                    <div
                      key={cmd.id}
                      className={`cp-item${isSelected ? ' selected' : ''}`}
                      onClick={() => { cmd.action(navigate); onClose() }}
                      onMouseEnter={() => setSelected(flatIdx)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="cp-item-icon" style={{ color: cmd.urgency ? urgColor : undefined }}>
                        {cmd.icon}
                      </span>
                      <div className="cp-item-text">
                        <span className="cp-item-label">{cmd.label}</span>
                        {cmd.sub && <span className="cp-item-sub">{cmd.sub}</span>}
                      </div>
                      {cmd.urgency && (
                        <span className="cp-item-urgency" style={{ color: urgColor, borderColor: urgColor + '44' }}>
                          {cmd.urgency.toUpperCase()}
                        </span>
                      )}
                      {isSelected && (
                        <span className="cp-item-enter">↵ ENTER</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="cp-footer">
          <span className="cp-hint"><kbd>↑↓</kbd> navigate</span>
          <span className="cp-hint"><kbd>↵</kbd> select</span>
          <span className="cp-hint"><kbd>ESC</kbd> close</span>
          <span className="cp-hint cp-hint-right"><kbd>Ctrl+K</kbd> toggle</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
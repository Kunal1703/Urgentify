import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import Dashboard from './pages/Dashboard.jsx'
import AddTask from './pages/AddTask.jsx'
import FocusMode from './pages/FocusMode.jsx'
import Archive from './pages/Archive.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import { useConfetti } from './hooks/useConfetti'

export const TaskContext = createContext(null)
export const useTaskContext = () => useContext(TaskContext)

const SAMPLE_TASKS = [
  {
    id: uuidv4(), title: 'Submit design proposal', category: 'Work', priority: 'critical',
    deadline: new Date(Date.now() + 1.5 * 3600000).toISOString(), estimatedHours: 2,
    description: 'Final presentation slides for the client review',
    createdAt: new Date().toISOString(), completed: false,
  },
  {
    id: uuidv4(), title: 'Review PR #247', category: 'Work', priority: 'urgent',
    deadline: new Date(Date.now() + 3 * 3600000).toISOString(), estimatedHours: 1,
    description: 'Code review for the authentication module',
    createdAt: new Date().toISOString(), completed: false,
  },
  {
    id: uuidv4(), title: 'Algorithm assignment', category: 'Study', priority: 'medium',
    deadline: new Date(Date.now() + 18 * 3600000).toISOString(), estimatedHours: 3,
    description: 'Dynamic programming problems set 4',
    createdAt: new Date().toISOString(), completed: false,
  },
  {
    id: uuidv4(), title: 'Gym session', category: 'Personal', priority: 'low',
    deadline: new Date(Date.now() + 36 * 3600000).toISOString(), estimatedHours: 1.5,
    description: 'Leg day workout',
    createdAt: new Date().toISOString(), completed: false,
  },
  {
    id: uuidv4(), title: 'Read design patterns', category: 'Study', priority: 'low',
    deadline: new Date(Date.now() + 72 * 3600000).toISOString(), estimatedHours: 2,
    description: 'Chapter 5–7: Behavioral patterns',
    createdAt: new Date().toISOString(), completed: false,
  },
]

function App() {
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dos-tasks')) || SAMPLE_TASKS } catch { return SAMPLE_TASKS }
  })
  const [archivedTasks, setArchivedTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dos-archive')) || [] } catch { return [] }
  })
  const [notification, setNotification] = useState(null)
  const [cmdOpen, setCmdOpen] = useState(false)
  const { fire } = useConfetti()

  useEffect(() => { localStorage.setItem('dos-tasks', JSON.stringify(tasks)) }, [tasks])
  useEffect(() => { localStorage.setItem('dos-archive', JSON.stringify(archivedTasks)) }, [archivedTasks])

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const notify = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() })
    setTimeout(() => setNotification(null), 3000)
  }

  const addTask = useCallback((task) => {
    const t = { ...task, id: uuidv4(), createdAt: new Date().toISOString(), completed: false }
    setTasks(p => [...p, t])
    notify(`"${task.title}" added`, 'success')
  }, [])

  const completeTask = useCallback((id) => {
    setTasks(p => {
      const task = p.find(t => t.id === id)
      if (task) {
        setArchivedTasks(a => [...a, { ...task, completedAt: new Date().toISOString(), completed: true }])
        notify(`"${task.title}" completed ✓`, 'success')
        fire()
      }
      return p.filter(t => t.id !== id)
    })
  }, [fire])

  const deleteTask = useCallback((id) => {
    setTasks(p => p.filter(t => t.id !== id))
    notify('Task deleted', 'info')
  }, [])

  return (
    <TaskContext.Provider value={{ tasks, archivedTasks, addTask, completeTask, deleteTask }}>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar onOpenCmd={() => setCmdOpen(true)} />
          <main className="app-main">
            <TopBar onOpenCmd={() => setCmdOpen(true)} />
            <div className="app-content">
              <Routes>
                <Route path="/"          element={<Dashboard />} />
                <Route path="/add"       element={<AddTask />} />
                <Route path="/focus"     element={<FocusMode />} />
                <Route path="/focus/:id" element={<FocusMode />} />
                <Route path="/archive"   element={<Archive />} />
              </Routes>
            </div>
          </main>
          {notification && <Notification key={notification.id} data={notification} />}
          <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
        </div>
      </BrowserRouter>
    </TaskContext.Provider>
  )
}

function Sidebar({ onOpenCmd }) {
  const { tasks } = useTaskContext()
  const critical = tasks.filter(t => {
    const h = (new Date(t.deadline) - new Date()) / 3600000
    return h > 0 && h <= 2
  }).length

  const nav = [
    { to: '/', icon: '⬡', label: 'DASHBOARD', end: true },
    { to: '/add', icon: '+', label: 'ADD TASK' },
    { to: '/focus', icon: '◎', label: 'FOCUS MODE' },
    { to: '/archive', icon: '▣', label: 'ARCHIVE' },
  ]

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-logo">
        <span className="logo-text">Urgentify</span>
        <span className="logo-version">v1.0</span>
      </div>
      <nav className="sidebar-nav">
        {nav.map(item => (
          <NavLink
            key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.to === '/' && critical > 0 && <span className="nav-badge">{critical}</span>}
          </NavLink>
        ))}
        <button className="nav-item nav-cmd-btn" onClick={onOpenCmd} aria-label="Open command palette (Ctrl+K)">
          <span className="nav-icon">⌘</span>
          <span className="nav-label">COMMAND</span>
          <span className="nav-cmd-hint">^K</span>
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-dot active" />
          <span>SYS ACTIVE</span>
        </div>
        <div className="task-count">{tasks.length} TASKS LIVE</div>
      </div>
    </aside>
  )
}

function TopBar({ onOpenCmd }) {
  const { tasks } = useTaskContext()
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const critical = tasks.filter(t => {
    const h = (new Date(t.deadline) - new Date()) / 3600000
    return h > 0 && h <= 2
  })

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-time">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
        <span className="topbar-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      </div>
      <div className="topbar-right">
        {critical.length >= 2 && (
          <button className="collision-warning" onClick={() => navigate('/')}
            aria-label={`${critical.length} deadline collision`}>
            <span className="blink">⚠</span>
            <span>DEADLINE COLLISION — {critical.length} tasks in &lt;2h</span>
          </button>
        )}
        <button className="topbar-cmd" onClick={onOpenCmd} aria-label="Open command palette">
          <span>⌘</span><span>Ctrl+K</span>
        </button>
        <button className="topbar-add" onClick={() => navigate('/add')} aria-label="Add new task">
          + NEW TASK
        </button>
      </div>
    </header>
  )
}

function Notification({ data }) {
  return (
    <div className={`notification notification-${data.type}`} role="alert" aria-live="polite">
      {data.message}
    </div>
  )
}

export default App
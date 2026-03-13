// ═══════════════════════════════════════════
// TIME CALCULATOR UTILITY
// ═══════════════════════════════════════════

export function getHoursRemaining(deadline) {
  return (new Date(deadline) - new Date()) / 3600000
}

export function getUrgencyLevel(deadline) {
  const h = getHoursRemaining(deadline)
  if (h <= 0)  return 'overdue'
  if (h <= 2)  return 'critical'
  if (h <= 6)  return 'urgent'
  if (h <= 24) return 'medium'
  return 'low'
}

export function getUrgencyColor(level) {
  return { overdue:'#ff0033', critical:'#ff2d55', urgent:'#ff8c00', medium:'#ffd60a', low:'#00ff88' }[level] || '#00ff88'
}

export function formatTimeRemaining(deadline) {
  const ms = new Date(deadline) - new Date()
  if (ms <= 0) return 'OVERDUE'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s % 60}s`
}

export function formatCountdown(deadline) {
  const ms = new Date(deadline) - new Date()
  if (ms <= 0) return { display: 'OVERDUE', urgent: true }
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = n => String(n).padStart(2, '0')
  if (d > 0) return { display: `${d}d ${pad(h)}h ${pad(m)}m`, urgent: false }
  return { display: `${pad(h)}:${pad(m)}:${pad(sec)}`, urgent: h < 2 }
}

export function getPressurePercent(deadline, createdAt) {
  const total = new Date(deadline) - new Date(createdAt)
  const remaining = new Date(deadline) - new Date()
  if (remaining <= 0) return 100
  if (total <= 0) return 0
  return Math.min(100, Math.pow(1 - remaining / total, 0.5) * 100)
}

export function getRadarRing(deadline) {
  const h = getHoursRemaining(deadline)
  if (h <= 2)  return 3
  if (h <= 6)  return 2
  if (h <= 24) return 1
  return 0
}

export function detectCollisions(tasks, windowHours = 4) {
  const active = tasks.filter(t => !t.completed && getHoursRemaining(t.deadline) > 0)
  const groups = []
  active.forEach(task => {
    const tt = new Date(task.deadline).getTime()
    let found = false
    for (const g of groups) {
      if (Math.abs(tt - new Date(g[0].deadline).getTime()) <= windowHours * 3600000) {
        g.push(task); found = true; break
      }
    }
    if (!found) groups.push([task])
  })
  return groups.filter(g => g.length >= 2)
}

export function buildWeekHeatmap(tasks) {
  const today = new Date(); today.setHours(0,0,0,0)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today); day.setDate(today.getDate() + i)
    const next = new Date(day); next.setDate(day.getDate() + 1)
    const dayTasks = tasks.filter(t => {
      const d = new Date(t.deadline)
      return d >= day && d < next && !t.completed
    })
    const weights = { critical:4, urgent:3, medium:2, low:1, overdue:0 }
    const stress = dayTasks.reduce((acc, t) => acc + (weights[getUrgencyLevel(t.deadline)] || 0), 0)
    return {
      label: day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      date: day, tasks: dayTasks, stress, isToday: i === 0,
    }
  })
}

export function sortByUrgency(tasks) {
  return [...tasks].sort((a, b) => {
    const ha = getHoursRemaining(a.deadline)
    const hb = getHoursRemaining(b.deadline)
    if (ha <= 0 && hb <= 0) return ha - hb
    if (ha <= 0) return -1
    if (hb <= 0) return 1
    return ha - hb
  })
}

export function getFeasibility(deadline, estimatedHours) {
  const h = getHoursRemaining(deadline)
  if (!estimatedHours) return null
  const r = h / estimatedHours
  if (r < 1)   return { status:'impossible',   label:'NOT FEASIBLE',  color:'var(--red)' }
  if (r < 1.5) return { status:'tight',        label:'TIGHT',         color:'var(--orange)' }
  if (r < 3)   return { status:'ok',           label:'FEASIBLE',      color:'var(--yellow)' }
  return       { status:'comfortable', label:'COMFORTABLE',   color:'var(--green)' }
}
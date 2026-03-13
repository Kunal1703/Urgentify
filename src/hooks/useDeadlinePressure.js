import { useState, useEffect } from 'react'
import {
  getHoursRemaining, getUrgencyLevel, getPressurePercent,
  formatTimeRemaining, formatCountdown, detectCollisions,
  sortByUrgency, getFeasibility,
} from '../utils/timecalculator'

export function useDeadlinePressure(tasks) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const enrichedTasks = tasks.map(task => ({
    ...task,
    hoursRemaining:  getHoursRemaining(task.deadline),
    urgencyLevel:    getUrgencyLevel(task.deadline),
    pressurePercent: getPressurePercent(task.deadline, task.createdAt),
    timeRemaining:   formatTimeRemaining(task.deadline),
    countdown:       formatCountdown(task.deadline),
    feasibility:     getFeasibility(task.deadline, task.estimatedHours),
  }))

  return {
    enrichedTasks,
    sortedTasks:   sortByUrgency(enrichedTasks),
    collisions:    detectCollisions(tasks),
    criticalCount: enrichedTasks.filter(t => t.urgencyLevel === 'critical').length,
    overdueCount:  enrichedTasks.filter(t => t.urgencyLevel === 'overdue').length,
    tick,
  }
}

export function useSingleTaskPressure(task) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  if (!task) return null
  return {
    hoursRemaining:  getHoursRemaining(task.deadline),
    urgencyLevel:    getUrgencyLevel(task.deadline),
    pressurePercent: getPressurePercent(task.deadline, task.createdAt),
    timeRemaining:   formatTimeRemaining(task.deadline),
    countdown:       formatCountdown(task.deadline),
    feasibility:     getFeasibility(task.deadline, task.estimatedHours),
    tick,
  }
}
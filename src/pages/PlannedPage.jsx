import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { todayISO, addDaysISO, endOfMonthISO, weekdayName, formatLongDate } from '../lib/date'
import PlannedRow from '../components/tasks/PlannedRow'
import TaskEditModal from '../components/tasks/TaskEditModal'
import TaskCaptureModal from '../components/tasks/TaskCaptureModal'

// Grouped by planned_date only — a task with no planned_date has no claim
// here (was a bug; Full List/Projects View are where undated tasks live).
//
// This Week here is a ROLLING 7-day window starting today — deliberately
// different from the standalone This Week screen's fixed Monday–Sunday of
// the calendar week (WeekPage.jsx). Don't unify the two. This Week is
// broken into individual date headers (the original literal-date design);
// Next Week, Next Month, and Later are each a single bucket with no
// further date subdivision.
//
// Past planned dates (before today) get their own "Overdue" heading,
// listed first, rather than being folded into This Week's date list.
export default function PlannedPage({
  session, startSession, onSessionStarted, captureOpen, onCloseCapture,
  roles, createRole, projects,
}) {
  const { tasks, loading, error, createTask, updateTask } = useTasks(session)
  const [openTaskId, setOpenTaskId] = useState(null)

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null

  const groups = useMemo(() => {
    const today = todayISO()
    const weekEnd = addDaysISO(today, 6)
    const nextWeekStart = addDaysISO(today, 7)
    const nextWeekEnd = addDaysISO(today, 13)
    const nextMonthEnd = endOfMonthISO(today, 1)

    const planned = tasks.filter((t) => t.status !== 'done' && t.planned_date)

    const overdueTasks = planned
      .filter((t) => t.planned_date < today)
      .sort((a, b) => (a.planned_date < b.planned_date ? -1 : 1))

    const thisWeekTasks = planned.filter((t) => t.planned_date >= today && t.planned_date <= weekEnd)
    const byDate = {}
    for (const t of thisWeekTasks) {
      (byDate[t.planned_date] ??= []).push(t)
    }
    const thisWeekGroups = Object.keys(byDate).sort().map((iso) => ({
      key: iso,
      label: iso === today ? 'Today' : weekdayName(iso),
      date: formatLongDate(iso),
      tasks: byDate[iso],
    }))

    const nextWeekTasks = planned.filter((t) => t.planned_date >= nextWeekStart && t.planned_date <= nextWeekEnd)
    const nextMonthTasks = planned.filter((t) => t.planned_date > nextWeekEnd && t.planned_date <= nextMonthEnd)
    const laterTasks = planned.filter((t) => t.planned_date > nextMonthEnd)

    return [
      { key: 'overdue', label: 'Overdue', date: 'Before today', tasks: overdueTasks },
      ...thisWeekGroups,
      { key: 'next-week', label: 'Next week', date: `${formatLongDate(nextWeekStart)} – ${formatLongDate(nextWeekEnd)}`, tasks: nextWeekTasks },
      { key: 'next-month', label: 'Next month', date: 'Through the end of next month', tasks: nextMonthTasks },
      { key: 'later', label: 'Later', date: 'Beyond next month', tasks: laterTasks },
    ].filter((g) => g.tasks.length > 0)
  }, [tasks])

  const handleStart = async (task) => {
    const { data, error } = await startSession(task.id)
    if (!error) onSessionStarted(task, data)
  }

  return (
    <main className="screen">
      <header>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Lists</div>
        <h1 className="screen-title">Planned</h1>
        <p className="screen-subtitle">Everything with a planned date, in the order it comes up.</p>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : groups.length === 0 ? (
        <p>Nothing planned yet.</p>
      ) : (
        <div className="planned-group">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="planned-group-header">
                <span className="planned-group-title">{group.label}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{group.date}</span>
                <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              {group.tasks.map((task) => (
                <PlannedRow
                  key={task.id}
                  task={task}
                  projects={projects}
                  roles={roles}
                  onStart={handleStart}
                  onUpdate={updateTask}
                  onOpen={(t) => setOpenTaskId(t.id)}
                />
              ))}
            </section>
          ))}
        </div>
      )}

      {openTask && (
        <TaskEditModal
          task={openTask}
          projects={projects}
          roles={roles}
          onSave={updateTask}
          onCancel={() => setOpenTaskId(null)}
          onCreateRole={createRole}
        />
      )}

      {captureOpen && (
        <TaskCaptureModal
          onClose={onCloseCapture}
          onCreate={createTask}
          projects={projects}
          roles={roles}
          onCreateRole={createRole}
        />
      )}
    </main>
  )
}

import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { todayISO, mondayOfWeek, addDaysISO, weekdayName, formatLongDate } from '../lib/date'
import TaskCard from '../components/tasks/TaskCard'
import TaskEditModal from '../components/tasks/TaskEditModal'
import TaskCaptureModal from '../components/tasks/TaskCaptureModal'

// Fixed Monday–Sunday of the CURRENT calendar week — deliberately distinct
// from Planned's "This Week" bucket, which is a rolling 7-day window from
// today. Don't unify the two.
function buildDayGroups(today) {
  const monday = mondayOfWeek(today)
  const groups = []
  for (let offset = 0; offset < 7; offset++) {
    const iso = addDaysISO(monday, offset)
    const label = iso === today ? 'Today' : iso === addDaysISO(today, 1) ? 'Tomorrow' : weekdayName(iso)
    groups.push({ iso, label, date: formatLongDate(iso) })
  }
  return groups
}

export default function WeekPage({
  session, startSession, onSessionStarted, captureOpen, onCloseCapture,
  roles, createRole, projects,
}) {
  const { tasks, loading, error, createTask, updateTask } = useTasks(session)
  const [openTaskId, setOpenTaskId] = useState(null)

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null
  const dayGroups = useMemo(() => buildDayGroups(todayISO()), [])

  // Matches due_date OR planned_date falling within this Monday–Sunday —
  // a task planned for a day this week (even with no due date at all)
  // belongs here, same as one that's due that day.
  const groups = useMemo(() => {
    const weekStart = dayGroups[0].iso
    const weekEnd = dayGroups[6].iso
    const inWeek = (iso) => iso && iso >= weekStart && iso <= weekEnd
    const notDone = tasks.filter((t) => t.status !== 'done' && (inWeek(t.due_date) || inWeek(t.planned_date)))

    const groupDateFor = (t) => (inWeek(t.due_date) ? t.due_date : t.planned_date)

    return dayGroups.map((g) => ({
      ...g,
      tasks: notDone.filter((t) => groupDateFor(t) === g.iso),
    }))
  }, [tasks, dayGroups])

  const visibleGroups = groups.filter((g) => g.tasks.length > 0)

  const handleStart = async (task) => {
    const { data, error } = await startSession(task.id)
    if (!error) onSessionStarted(task, data)
  }

  return (
    <main className="screen">
      <header>
        <div className="eyebrow" style={{ marginBottom: 12 }}>{dayGroups[0].date} – {dayGroups[6].date}</div>
        <h1 className="screen-title">This week</h1>
        <p className="screen-subtitle">The same recommendations as Today's Top 3, laid out by day. Nothing here is prescribed — browse it and pull anything forward.</p>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : visibleGroups.length === 0 ? (
        <p>Nothing due or planned this week.</p>
      ) : (
        <div className="week-section">
          {visibleGroups.map((group) => (
            <section key={group.iso}>
              <div className="week-group-header">
                <span className="week-group-title">{group.label}</span>
                <span className="week-group-date">{group.date}</span>
                <span className="week-group-count">{group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}</span>
              </div>
              <div className="task-grid">
                {group.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projects={projects}
                    roles={roles}
                    onStart={handleStart}
                    onUpdate={updateTask}
                    onOpen={(t) => setOpenTaskId(t.id)}
                  />
                ))}
              </div>
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

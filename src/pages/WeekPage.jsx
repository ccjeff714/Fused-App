import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { useRoles } from '../hooks/useRoles'
import { isoDaysFromToday, weekdayName, formatLongDate } from '../lib/date'
import WeekCard from '../components/tasks/WeekCard'
import TaskEditModal from '../components/tasks/TaskEditModal'
import TaskCaptureModal from '../components/tasks/TaskCaptureModal'

function buildDayGroups() {
  const groups = []
  for (let offset = 0; offset < 7; offset++) {
    const iso = isoDaysFromToday(offset)
    const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : weekdayName(iso)
    groups.push({ iso, label, date: formatLongDate(iso) })
  }
  return groups
}

const DAY_GROUPS = buildDayGroups()

export default function WeekPage({ session, startSession, onSessionStarted, captureOpen, onCloseCapture }) {
  const { tasks, loading, error, createTask, updateTask } = useTasks(session)
  const { projects } = useProjects(session)
  const { roles, createIfNew: createRole } = useRoles(session)
  const [openTaskId, setOpenTaskId] = useState(null)

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null

  // Grouped by due_date only — an item with no due date has no claim to
  // "this week" (confirmed manual-test fix; previously an Unscheduled
  // bucket recreated the "identical to Full List" problem this screen was
  // built to solve).
  const groups = useMemo(() => {
    const notDone = tasks.filter((t) => t.status !== 'done')
    return DAY_GROUPS.map((g) => ({
      ...g,
      tasks: notDone.filter((t) => t.due_date === g.iso),
    }))
  }, [tasks])

  const visibleGroups = groups.filter((g) => g.tasks.length > 0)

  const handleStart = async (task) => {
    const { data, error } = await startSession(task.id)
    if (!error) onSessionStarted(task, data)
  }

  return (
    <main className="screen">
      <header>
        <div className="eyebrow" style={{ marginBottom: 12 }}>{DAY_GROUPS[0].date} – {DAY_GROUPS[6].date}</div>
        <h1 className="screen-title">This week</h1>
        <p className="screen-subtitle">The same recommendations as Today's Top 3, laid out by day. Nothing here is prescribed — browse it and pull anything forward.</p>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : visibleGroups.length === 0 ? (
        <p>Nothing due this week.</p>
      ) : (
        <div className="week-section">
          {visibleGroups.map((group) => (
            <section key={group.iso}>
              <div className="week-group-header">
                <span className="week-group-title">{group.label}</span>
                <span className="week-group-date">{group.date}</span>
                <span className="week-group-count">{group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}</span>
              </div>
              <div className="week-grid">
                {group.tasks.map((task) => (
                  <WeekCard
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

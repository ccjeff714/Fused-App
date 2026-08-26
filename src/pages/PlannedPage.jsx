import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { useRoles } from '../hooks/useRoles'
import { isoDaysFromToday } from '../lib/date'
import PlannedRow from '../components/tasks/PlannedRow'
import TaskEditModal from '../components/tasks/TaskEditModal'

// Grouped by planned_date (Overdue/Today/Tomorrow/Next week/Unscheduled) —
// distinct from This Week (grouped by due_date) and Full List (flat,
// filterable). No filter bar, per Phase2_Handoff_Spec.md's chat correction.
export default function PlannedPage({ session, startSession, onSessionStarted }) {
  const { tasks, loading, error, updateTask } = useTasks(session)
  const { projects } = useProjects(session)
  const { roles, createIfNew: createRole } = useRoles(session)
  const [openTaskId, setOpenTaskId] = useState(null)

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null

  const groups = useMemo(() => {
    const today = isoDaysFromToday(0)
    const tomorrow = isoDaysFromToday(1)
    const nextWeekStart = isoDaysFromToday(2)
    const nextWeekEnd = isoDaysFromToday(7)
    const notDone = tasks.filter((t) => t.status !== 'done')

    const overdue = notDone.filter((t) => t.planned_date && t.planned_date < today)
    const todayGroup = notDone.filter((t) => t.planned_date === today)
    const tomorrowGroup = notDone.filter((t) => t.planned_date === tomorrow)
    const nextWeek = notDone.filter((t) => t.planned_date >= nextWeekStart && t.planned_date <= nextWeekEnd)
    const unscheduled = notDone.filter((t) => !t.planned_date)

    return [
      { key: 'overdue', label: 'Overdue', date: 'Before today', tasks: overdue },
      { key: 'today', label: 'Today', date: 'Today', tasks: todayGroup },
      { key: 'tomorrow', label: 'Tomorrow', date: 'Tomorrow', tasks: tomorrowGroup },
      { key: 'next-week', label: 'Next week', date: 'The next 6 days', tasks: nextWeek },
      { key: 'unscheduled', label: 'Unscheduled', date: 'No planned date', tasks: unscheduled },
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
    </main>
  )
}

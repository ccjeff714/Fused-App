import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import TaskListView from '../components/tasks/TaskListView'
import TaskCaptureModal from '../components/tasks/TaskCaptureModal'

// initialStatusFilter/isCompletedEntry are set by App.jsx's "Completed" nav
// item (routes here with statusFilter="done" rather than a dedicated
// screen — see the final report for why). isCompletedEntry only reflects
// how the screen was entered, not whatever status filter is currently
// selected, so the heading doesn't flip back to "Full list" just because
// someone clears the Done filter chip after arriving via Completed.
// App.jsx renders this with key={route} so Completed always forces
// status=done and Full List always resets to its own default on every
// fresh entry, regardless of which of the two was open before.
export default function FullListPage({
  session, initialStatusFilter = 'all', isCompletedEntry = false, captureOpen, onCloseCapture,
  roles, createRole, projects,
}) {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks(session)
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)

  return (
    <main className="screen">
      <header>
        <div className="eyebrow" style={{ marginBottom: 12 }}>{isCompletedEntry ? 'Lists' : 'Workspace'}</div>
        <h1 className="screen-title" style={{ marginBottom: 0 }}>{isCompletedEntry ? 'Completed' : 'Full list'}</h1>
      </header>

      <TaskListView
        tasks={tasks}
        loading={loading}
        error={error}
        projects={projects}
        roles={roles}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onCreateRole={createRole}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

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

import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { useRoles } from '../hooks/useRoles'
import TaskListView from '../components/tasks/TaskListView'
import TaskCaptureModal from '../components/tasks/TaskCaptureModal'
import { IconPlus } from '../components/icons'

// initialStatusFilter is set by App.jsx's "Completed" nav item (routes here
// with statusFilter="done" rather than a dedicated screen — see the final
// report for why).
export default function FullListPage({ session, initialStatusFilter = 'all' }) {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks(session)
  const { projects } = useProjects(session)
  const { roles, createIfNew: createRole } = useRoles(session)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Workspace</div>
          <h1 className="screen-title" style={{ marginBottom: 0 }}>Full list</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCaptureOpen(true)}>
          <IconPlus size={17} />
          <span>Capture task</span>
        </button>
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
          onClose={() => setCaptureOpen(false)}
          onCreate={createTask}
          projects={projects}
          roles={roles}
          onCreateRole={createRole}
        />
      )}
    </main>
  )
}

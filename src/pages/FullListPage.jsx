import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import TaskListView from '../components/tasks/TaskListView'
import TaskCaptureModal from '../components/tasks/TaskCaptureModal'

export default function FullListPage({ session }) {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks(session)
  const [captureOpen, setCaptureOpen] = useState(false)

  return (
    <div className="full-list-page">
      <div className="full-list-header">
        <h1>Tasks</h1>
        <button type="button" className="capture-button" onClick={() => setCaptureOpen(true)}>
          + Capture task
        </button>
      </div>

      <TaskListView
        tasks={tasks}
        loading={loading}
        error={error}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />

      {captureOpen && (
        <TaskCaptureModal
          onClose={() => setCaptureOpen(false)}
          onCreate={createTask}
        />
      )}
    </div>
  )
}

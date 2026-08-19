import { useState, useMemo } from 'react'
import TaskCard from './TaskCard'
import TaskEditForm from './TaskEditForm'

const STATUSES = ['not_started', 'in_progress', 'blocked', 'done']
const PRIORITY_TIERS = ['critical', 'high_priority', 'medium_priority', 'low_priority']

export default function TaskListView({ tasks, loading, error, onUpdate, onDelete }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [editingTask, setEditingTask] = useState(null)

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (priorityFilter !== 'all' && task.priority_tier !== priorityFilter) return false
      return true
    })
  }, [tasks, statusFilter, priorityFilter])

  const handleDelete = (task) => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      onDelete(task.id)
    }
  }

  if (loading) return <p>Loading tasks...</p>

  return (
    <div className="task-list-view">
      {error && <p className="error-text">{error}</p>}

      <div className="task-filters">
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All</option>
            {PRIORITY_TIERS.map((tier) => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
        </label>
      </div>

      {filteredTasks.length === 0 ? (
        <p>No tasks match the current filters.</p>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) =>
            editingTask?.id === task.id ? (
              <TaskEditForm
                key={task.id}
                task={task}
                onSave={onUpdate}
                onCancel={() => setEditingTask(null)}
              />
            ) : (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

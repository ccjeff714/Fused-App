import { useState, useMemo } from 'react'
import { tierInfo, statusLabel } from '../../lib/taskDisplay'
import TaskCard from './TaskCard'
import TaskEditModal from './TaskEditModal'

const STATUSES = ['not_started', 'in_progress', 'blocked', 'done']
const PRIORITY_TIERS = ['critical', 'high_priority', 'medium_priority', 'low_priority']

export default function TaskListView({
  tasks, loading, error, projects, roles, onUpdate, onDelete, onCreateRole,
  statusFilter, onStatusFilterChange,
}) {
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingTaskId, setEditingTaskId] = useState(null)

  const editingTask = tasks.find((t) => t.id === editingTaskId) ?? null

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (priorityFilter !== 'all' && task.priority_tier !== priorityFilter) return false
      if (projectFilter !== 'all' && task.project_id !== projectFilter) return false
      if (roleFilter !== 'all' && task.role_id !== roleFilter) return false
      return true
    })
  }, [tasks, statusFilter, priorityFilter, projectFilter, roleFilter])

  const handleDelete = (task) => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      onDelete(task.id)
      setEditingTaskId(null)
    }
  }

  if (loading) return <p>Loading tasks...</p>

  return (
    <div>
      {error && <p className="error-text">{error}</p>}

      <div className="filter-bar">
        <div className="filter-group">
          <span className="eyebrow">Status</span>
          <div className="filter-chips">
            {['all', ...STATUSES].map((s) => (
              <button
                key={s}
                type="button"
                className={statusFilter === s ? 'filter-chip active' : 'filter-chip'}
                onClick={() => onStatusFilterChange(s)}
              >
                {s === 'all' ? 'All' : statusLabel(s)}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="eyebrow">Priority</span>
          <div className="filter-chips">
            {['all', ...PRIORITY_TIERS].map((t) => (
              <button
                key={t}
                type="button"
                className={priorityFilter === t ? 'filter-chip active' : 'filter-chip'}
                onClick={() => setPriorityFilter(t)}
              >
                {t === 'all' ? 'All' : tierInfo(t).label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="eyebrow">Project</span>
          <select className="select" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="all">All</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <span className="eyebrow">Role</span>
          <select className="select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <p>No tasks match the current filters.</p>
      ) : (
        <div className="task-grid">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projects={projects}
              roles={roles}
              onUpdate={onUpdate}
              onOpen={(t) => setEditingTaskId(t.id)}
            />
          ))}
        </div>
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          projects={projects}
          roles={roles}
          onSave={onUpdate}
          onCancel={() => setEditingTaskId(null)}
          onCreateRole={onCreateRole}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

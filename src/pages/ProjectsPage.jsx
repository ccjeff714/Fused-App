import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { useRoles } from '../hooks/useRoles'
import { statusLabel } from '../lib/taskDisplay'
import TaskEditModal from '../components/tasks/TaskEditModal'
import TaskCaptureModal from '../components/tasks/TaskCaptureModal'
import { IconChevronRight, IconChevronLeft, IconPlay, IconPlus } from '../components/icons'

// Roles as collapsible top-level sections, Projects nested inside each
// (Phase5_Handoff_Spec.md §4 — Direction 7d prior art). Project creation
// lives here, scoped per role section, since a Project requires a Role
// (§3) and neither spec defines a Project-creation UI elsewhere — see the
// final report for this scope note.
export default function ProjectsPage({ session, startSession, onSessionStarted, captureOpen, onCloseCapture }) {
  const { tasks, createTask, updateTask } = useTasks(session)
  const { projects, createProject } = useProjects(session)
  const { roles, createIfNew: createRole } = useRoles(session)
  const [openRoleIds, setOpenRoleIds] = useState(() => new Set())
  const [focusProjectId, setFocusProjectId] = useState(null)
  const [newProjectRoleId, setNewProjectRoleId] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [openTaskId, setOpenTaskId] = useState(null)

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null
  const focusProject = projects.find((p) => p.id === focusProjectId) ?? null

  const roleSections = useMemo(() => roles.map((role) => {
    const roleProjects = projects.filter((p) => p.role_id === role.id).map((project) => {
      const projectTasks = tasks.filter((t) => t.project_id === project.id)
      const open = projectTasks.filter((t) => t.status !== 'done').length
      return { ...project, openCount: open, totalCount: projectTasks.length }
    })
    const loose = tasks.filter((t) => t.role_id === role.id && !t.project_id)
    const totalTasks = tasks.filter((t) => t.role_id === role.id).length
    return { ...role, projects: roleProjects, loose, totalTasks }
  }), [roles, projects, tasks])

  const toggleRole = (roleId) => {
    setOpenRoleIds((current) => {
      const next = new Set(current)
      if (next.has(roleId)) next.delete(roleId); else next.add(roleId)
      return next
    })
  }

  const handleCreateProject = async (e, roleId) => {
    e.preventDefault()
    const name = newProjectName.trim()
    if (!name) return
    const { error } = await createProject({ name, role_id: roleId })
    if (!error) {
      setNewProjectName('')
      setNewProjectRoleId(null)
    }
  }

  const handleStart = async (task) => {
    const { data, error } = await startSession(task.id)
    if (!error) onSessionStarted(task, data)
  }

  const focusTasks = focusProject ? tasks.filter((t) => t.project_id === focusProject.id) : []
  const focusRole = focusProject ? roles.find((r) => r.id === focusProject.role_id) : null
  const focusOpenCount = focusTasks.filter((t) => t.status !== 'done').length

  if (focusProject) {
    return (
      <main className="screen">
        <header>
          <button type="button" className="back-link" onClick={() => setFocusProjectId(null)}>
            <IconChevronLeft size={15} />
            <span>All projects</span>
          </button>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{focusRole?.name ?? ''}</div>
          <h1 className="screen-title">{focusProject.name}</h1>
          <p className="screen-subtitle">{focusOpenCount} open of {focusTasks.length} {focusTasks.length === 1 ? 'task' : 'tasks'}</p>
        </header>

        {focusTasks.length === 0 ? (
          <p>No tasks in this project yet.</p>
        ) : (
          <div>
            {focusTasks.map((task) => (
              <div key={task.id} className="list-row" onClick={() => setOpenTaskId(task.id)}>
                <span className={task.status === 'done' ? 'list-row-title done' : 'list-row-title'} style={{ flex: 1 }}>
                  {task.title}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{task.due_date || 'No due date'}</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={(e) => { e.stopPropagation(); handleStart(task) }}
                >
                  <IconPlay size={14} />
                  <span>Start</span>
                </button>
              </div>
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

  return (
    <main className="screen">
      <header>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Workspace</div>
        <h1 className="screen-title">Projects</h1>
        <p className="screen-subtitle">Your roles hold the projects. Open a role to see what sits under it, then open a project for its tasks.</p>
      </header>

      <div>
        {roleSections.map((role) => {
          const expanded = openRoleIds.has(role.id)
          return (
            <section key={role.id} className="role-section">
              <button type="button" className="role-section-header" onClick={() => toggleRole(role.id)}>
                <span className="role-chevron" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  <IconChevronRight size={16} />
                </span>
                <span className="role-name">{role.name}</span>
                <span className="role-meta">
                  {role.projects.length} {role.projects.length === 1 ? 'project' : 'projects'} · {role.totalTasks} {role.totalTasks === 1 ? 'task' : 'tasks'}
                </span>
              </button>

              {expanded && (
                <div className="role-section-body">
                  {role.projects.map((project) => (
                    <div key={project.id} className="project-row" onClick={() => setFocusProjectId(project.id)}>
                      <span className="project-row-name">{project.name}</span>
                      <span className="project-row-meta">{project.openCount} open · {project.totalCount} total</span>
                      <IconChevronRight size={16} />
                    </div>
                  ))}

                  {newProjectRoleId === role.id ? (
                    <form onSubmit={(e) => handleCreateProject(e, role.id)} style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        autoFocus
                        placeholder="New project name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: 'var(--text-primary)', font: 'inherit' }}
                      />
                      <button type="submit" className="btn btn-outline btn-sm" disabled={!newProjectName.trim()}>Add</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewProjectRoleId(null)}>Cancel</button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => { setNewProjectRoleId(role.id); setNewProjectName('') }}
                    >
                      <IconPlus size={14} />
                      <span>New project</span>
                    </button>
                  )}

                  {role.loose.length > 0 && (
                    <div className="loose-tasks">
                      <div className="eyebrow" style={{ marginBottom: 8 }}>No project</div>
                      {role.loose.map((task) => (
                        <div key={task.id} className="loose-task-row" onClick={() => setOpenTaskId(task.id)}>
                          <span style={{ width: 7, height: 7, flex: 'none', borderRadius: 999, background: 'var(--border-strong)' }} />
                          <span className={task.status === 'done' ? 'list-row-title done' : ''} style={{ flex: 1, minWidth: 0 }}>
                            {task.title}
                          </span>
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{statusLabel(task.status)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>

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

import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { statusLabel } from '../lib/taskDisplay'
import TaskEditModal from '../components/tasks/TaskEditModal'
import TaskCaptureModal from '../components/tasks/TaskCaptureModal'
import ProjectCreateModal from '../components/projects/ProjectCreateModal'
import { IconChevronRight, IconChevronLeft, IconPlay, IconPlus } from '../components/icons'

// Roles as collapsible top-level sections, Projects nested inside each
// (Phase5_Handoff_Spec.md §4 — Direction 7d prior art). Inline project
// creation here is one of two entry points (Phase5_Handoff_Spec.md §10)
// — the other is the sidebar's global "+" next to Projects (AppShell) —
// sharing components/projects/ProjectCreateModal.jsx. This one locks Role
// to whichever section it was opened from. roles/createRole/projects/
// createProject come from App.jsx's single shared instance — this used to
// have its own separate useRoles/useProjects, which was the actual bug
// behind a newly created Role/Project not showing up without a refresh.
export default function ProjectsPage({
  session, startSession, onSessionStarted, captureOpen, onCloseCapture,
  roles, createRole, projects, createProject,
}) {
  const { tasks, createTask, updateTask } = useTasks(session)
  const [openRoleIds, setOpenRoleIds] = useState(() => new Set())
  const [focusProjectId, setFocusProjectId] = useState(null)
  const [newProjectRoleId, setNewProjectRoleId] = useState(null)
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
          {focusProject.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-md)', maxWidth: '60ch', marginBottom: 12 }}>
              {focusProject.description}
            </p>
          )}
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

                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setNewProjectRoleId(role.id)}
                  >
                    <IconPlus size={14} />
                    <span>New project</span>
                  </button>

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

      {newProjectRoleId && (
        <ProjectCreateModal
          roles={roles}
          lockedRoleId={newProjectRoleId}
          lockedRoleName={roles.find((r) => r.id === newProjectRoleId)?.name}
          onCreate={createProject}
          onCreateRole={createRole}
          onClose={() => setNewProjectRoleId(null)}
        />
      )}
    </main>
  )
}

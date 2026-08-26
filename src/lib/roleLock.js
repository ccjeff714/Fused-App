// Shared auto-fill-and-lock helper (Phase5_Handoff_Spec.md §3/§6/§7): when a
// task has a project selected, its role is forced to match the project's
// role and the Role field becomes read-only in the UI (the server-side
// enforcement is the sync_role_on_project_change trigger — this just mirrors
// it client-side so the picker doesn't show a stale/incorrect value before
// save). Reused by Capture, TaskEditModal, and TaskDetailPanel instead of
// three separate copies of this logic.
export function computeRoleLock({ projectId, projects, freeRoleValue }) {
  const project = projectId ? projects.find((p) => p.id === projectId) : null

  if (project) {
    return {
      roleValue: project.role_id || '',
      roleLocked: true,
      roleHint: 'set by project',
      roleOpacity: 0.6,
    }
  }

  return {
    roleValue: freeRoleValue || '',
    roleLocked: false,
    roleHint: 'optional',
    roleOpacity: 1,
  }
}

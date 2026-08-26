// Project (filled accent pill) + Role (outlined pill) badges — shown only
// when present. Role stays meaningful without a Project since standalone
// tasks can carry one directly (Phase5_Handoff_Spec.md §8).
export default function TaskBadges({ task, projects, roles }) {
  const project = task.project_id ? projects.find((p) => p.id === task.project_id) : null
  const role = task.role_id ? roles.find((r) => r.id === task.role_id) : null

  if (!project && !role) return null

  return (
    <>
      {project && <span className="badge badge-project">{project.name}</span>}
      {role && <span className="badge badge-role">{role.name}</span>}
    </>
  )
}

import { useState } from 'react'
import {
  IconSun,
  IconMoon,
  IconSun as IconToday,
  IconCalendarWeek,
  IconPlanned,
  IconCheckCircle,
  IconFolder,
  IconListMenu,
  IconSettings,
  IconPlus,
} from '../icons'
import ProjectCreateModal from '../projects/ProjectCreateModal'

const LISTS_NAV = [
  { id: 'today', label: 'Today', Icon: IconToday, dot: true },
  { id: 'week', label: 'This Week', Icon: IconCalendarWeek, dot: true },
  { id: 'planned', label: 'Planned', Icon: IconPlanned },
  { id: 'completed', label: 'Completed', Icon: IconCheckCircle },
]

const WORKSPACE_NAV = [
  { id: 'projects', label: 'Projects', Icon: IconFolder },
  { id: 'list', label: 'Full list', Icon: IconListMenu },
  { id: 'settings', label: 'Settings', Icon: IconSettings },
]

function NavButton({ item, active, onClick }) {
  const { Icon, label, dot } = item
  return (
    <button
      type="button"
      className={active ? 'nav-link active' : 'nav-link'}
      onClick={onClick}
    >
      <Icon size={18} className="nav-link-icon" />
      <span className="nav-link-label">{label}</span>
      {dot && <span className="nav-link-dot" />}
    </button>
  )
}

export default function AppShell({
  route, onNavigate, isDark, onToggleTheme, session, chromeVisible, children,
  onOpenCapture, showCapture, roles, createRole, createProject,
}) {
  // roles/createProject come from App.jsx's single shared useRoles/
  // useProjects instance (Phase5_Handoff_Spec.md §10's second entry
  // point) — previously this component had its own separate instance,
  // which was the actual bug behind newly created projects not showing
  // up elsewhere without a hard refresh.
  const [projectModalOpen, setProjectModalOpen] = useState(false)

  if (!chromeVisible) {
    return <div className="app-shell">{children}</div>
  }

  return (
    <div className="app-shell">
      {showCapture && (
        <button type="button" className="global-capture-btn btn btn-primary" onClick={onOpenCapture}>
          <IconPlus size={17} />
          <span>Capture task</span>
        </button>
      )}
      <aside className="app-sidebar">
        <div className="app-logo">
          <span>Fused</span>
          <span className="app-logo-dot" />
        </div>

        <nav className="sidebar-nav">
          <div className="eyebrow" style={{ marginBottom: 8 }}>Lists</div>
          {LISTS_NAV.map((item) => (
            <NavButton key={item.id} item={item} active={route === item.id} onClick={() => onNavigate(item.id)} />
          ))}
        </nav>

        <nav className="sidebar-nav">
          <div className="eyebrow" style={{ marginBottom: 8 }}>Workspace</div>
          {WORKSPACE_NAV.map((item) => (
            item.id === 'projects' ? (
              <div key={item.id} className="nav-link-with-action">
                <NavButton item={item} active={route === item.id} onClick={() => onNavigate(item.id)} />
                <button
                  type="button"
                  className="nav-link-action"
                  onClick={() => setProjectModalOpen(true)}
                  aria-label="New project"
                  title="New project"
                >
                  <IconPlus size={14} />
                </button>
              </div>
            ) : (
              <NavButton key={item.id} item={item} active={route === item.id} onClick={() => onNavigate(item.id)} />
            )
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="theme-toggle-btn" onClick={onToggleTheme}>
            {isDark ? <IconMoon size={16} /> : <IconSun size={16} />}
            <span>{isDark ? 'Dark' : 'Light'}</span>
          </button>
          <span className="sidebar-email">{session?.user?.email}</span>
        </div>
      </aside>

      <div className="app-content">{children}</div>

      {projectModalOpen && (
        <ProjectCreateModal
          roles={roles}
          onCreate={createProject}
          onCreateRole={createRole}
          onClose={() => setProjectModalOpen(false)}
        />
      )}
    </div>
  )
}

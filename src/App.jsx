import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import { useTheme } from './hooks/useTheme'
import { useRoles } from './hooks/useRoles'
import { useProjects } from './hooks/useProjects'
import AppShell from './components/layout/AppShell'
import SignIn from './SignIn'
import HomePage from './pages/HomePage'
import FullListPage from './pages/FullListPage'
import WeekPage from './pages/WeekPage'
import PlannedPage from './pages/PlannedPage'
import ProjectsPage from './pages/ProjectsPage'
import SettingsPage from './pages/SettingsPage'
import SessionFlow from './components/session/SessionFlow'
import './App.css'

export default function App() {
  const { session, loading, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [route, setRoute] = useState('today')
  const sessionLifecycle = useSession(session)
  const [activeTask, setActiveTask] = useState(null)
  const [captureOpen, setCaptureOpen] = useState(false)

  // Single shared instance for the whole app — roles/projects are created
  // from several genuinely different places (Capture, Edit modal, Today
  // panel, Projects View's inline "+ New project", and the sidebar's
  // global "+"), and those don't all live under the same page. Giving
  // each page (and AppShell) its own separate useRoles/useProjects call
  // was the actual bug behind "a new Role/Project doesn't show up without
  // a manual refresh" — the create succeeded and the DB had it, but
  // whichever *other* component's own independent copy of the list had
  // no way to know. One shared instance, passed down everywhere, removes
  // the whole class of bug instead of patching each occurrence.
  const rolesState = useRoles(session)
  const projectsState = useProjects(session)

  if (loading) return <p>Loading...</p>

  if (!session) return <SignIn />

  const { activeSession, startSession, endSession } = sessionLifecycle
  const { roles, createIfNew: createRole } = rolesState
  const { projects, createProject } = projectsState

  const handleSessionStarted = (task) => setActiveTask(task)
  const handleSessionExit = () => setActiveTask(null)

  // Active session / break / celebration hide the sidebar entirely and take
  // the full window, regardless of which screen the session was started
  // from (Phase2_Handoff_Spec.md A6: chrome hides, timer takes the window).
  // Gated on activeTask alone, not activeSession — Mark Complete closes the
  // execution_sessions row (activeSession -> null) while the celebration
  // screen and an optional post-completion break still need to render.
  if (activeTask) {
    return (
      <div className="app-shell">
        <SessionFlow
          session={session}
          task={activeTask}
          executionSession={activeSession}
          endSession={endSession}
          onExit={handleSessionExit}
        />
      </div>
    )
  }

  // Quick capture is shared shell chrome (AppShell renders the button) —
  // each page still owns its own TaskCaptureModal, just controlled via
  // these props, so newly created tasks land in that page's own
  // already-fetched task list instead of going stale. roles/projects are
  // the one shared instance above, passed through to every page.
  const sessionProps = {
    session, startSession, onSessionStarted: handleSessionStarted,
    captureOpen, onCloseCapture: () => setCaptureOpen(false),
    roles, createRole, projects, createProject,
  }

  let content
  switch (route) {
    case 'week':
      content = <WeekPage {...sessionProps} />
      break
    case 'planned':
      content = <PlannedPage {...sessionProps} />
      break
    case 'list':
      // key={route} forces a remount when switching list <-> completed —
      // both cases render the same component at the same tree position,
      // so without it React reuses the instance and FullListPage's
      // statusFilter (a useState seeded from initialStatusFilter) never
      // re-evaluates its initializer, leaving the filter stuck on
      // whichever of the two screens was visited first.
      content = <FullListPage key={route} {...sessionProps} />
      break
    case 'completed':
      content = <FullListPage key={route} {...sessionProps} initialStatusFilter="done" isCompletedEntry />
      break
    case 'projects':
      content = <ProjectsPage {...sessionProps} />
      break
    case 'settings':
      content = <SettingsPage session={session} signOut={signOut} />
      break
    case 'today':
    default:
      content = <HomePage {...sessionProps} />
  }

  return (
    <AppShell
      route={route}
      onNavigate={setRoute}
      isDark={isDark}
      onToggleTheme={toggleTheme}
      session={session}
      chromeVisible
      onOpenCapture={() => setCaptureOpen(true)}
      showCapture={route !== 'settings'}
      roles={roles}
      createRole={createRole}
      createProject={createProject}
    >
      {content}
    </AppShell>
  )
}

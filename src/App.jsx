import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import { useTheme } from './hooks/useTheme'
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

  if (loading) return <p>Loading...</p>

  if (!session) return <SignIn />

  const { activeSession, startSession, endSession } = sessionLifecycle

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

  const sessionProps = { session, startSession, onSessionStarted: handleSessionStarted }

  let content
  switch (route) {
    case 'week':
      content = <WeekPage {...sessionProps} />
      break
    case 'planned':
      content = <PlannedPage {...sessionProps} />
      break
    case 'list':
      content = <FullListPage {...sessionProps} />
      break
    case 'completed':
      content = <FullListPage {...sessionProps} initialStatusFilter="done" />
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
    >
      {content}
    </AppShell>
  )
}

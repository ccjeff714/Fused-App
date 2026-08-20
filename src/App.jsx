import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import SignIn from './SignIn'
import HomePage from './pages/HomePage'
import FullListPage from './pages/FullListPage'
import './App.css'

function App() {
  const { session, loading, signOut } = useAuth()
  const [route, setRoute] = useState('home')
  const sessionLifecycle = useSession(session)

  if (loading) return <p>Loading...</p>

  if (!session) return <SignIn />

  const hasActiveSession = Boolean(sessionLifecycle.activeSession)

  return (
    <div>
      <header className="app-header">
        <nav className="app-nav">
          <button
            type="button"
            className={route === 'home' ? 'nav-link active' : 'nav-link'}
            onClick={() => setRoute('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={route === 'fullList' ? 'nav-link active' : 'nav-link'}
            onClick={() => setRoute('fullList')}
            disabled={hasActiveSession}
            title={hasActiveSession ? 'End your active session first' : undefined}
          >
            Full List
          </button>
        </nav>
        <div className="app-header-account">
          <p>Signed in as {session.user.email}</p>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>
      {route === 'home' ? (
        <HomePage session={session} sessionLifecycle={sessionLifecycle} />
      ) : (
        <FullListPage session={session} />
      )}
    </div>
  )
}

export default App

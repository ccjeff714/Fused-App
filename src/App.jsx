import { useAuth } from './hooks/useAuth'
import SignIn from './SignIn'
import FullListPage from './pages/FullListPage'
import './App.css'

function App() {
  const { session, loading, signOut } = useAuth()

  if (loading) return <p>Loading...</p>

  if (!session) return <SignIn />

  return (
    <div>
      <header className="app-header">
        <p>Signed in as {session.user.email}</p>
        <button onClick={signOut}>Sign out</button>
      </header>
      <FullListPage session={session} />
    </div>
  )
}

export default App

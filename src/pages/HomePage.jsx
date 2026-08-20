import { useState } from 'react'
import { useSession } from '../hooks/useSession'
import HomeSessionScreen from '../components/session/HomeSessionScreen'
import ActiveSessionScreen from '../components/session/ActiveSessionScreen'

export default function HomePage({ session }) {
  const { activeSession, startSession, endSession } = useSession(session)
  const [activeTask, setActiveTask] = useState(null)

  const handleSessionStarted = (task) => {
    setActiveTask(task)
  }

  const handleExit = () => {
    setActiveTask(null)
  }

  if (activeSession && activeTask) {
    return (
      <ActiveSessionScreen
        session={session}
        task={activeTask}
        executionSession={activeSession}
        endSession={endSession}
        onExit={handleExit}
      />
    )
  }

  return (
    <HomeSessionScreen
      session={session}
      startSession={startSession}
      onSessionStarted={handleSessionStarted}
    />
  )
}

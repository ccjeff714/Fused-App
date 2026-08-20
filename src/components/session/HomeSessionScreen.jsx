import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useTopThree } from '../../hooks/useTopThree'
import TopThreeCard from './TopThreeCard'
import ManualOverridePicker from './ManualOverridePicker'
import TaskCaptureModal from '../tasks/TaskCaptureModal'

export default function HomeSessionScreen({ session, startSession, onSessionStarted }) {
  const { tasks, createTask } = useTasks(session)
  const { topThree, loading, error, setOverride, refetch } = useTopThree(session)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [overrideSlot, setOverrideSlot] = useState(null)
  const [starting, setStarting] = useState(false)

  const handleCreate = async (fields) => {
    const result = await createTask(fields)
    if (!result.error) refetch()
    return result
  }

  const handleStart = async (task) => {
    setStarting(true)
    const { data, error } = await startSession(task.id)
    setStarting(false)
    if (!error) onSessionStarted(task, data)
  }

  const handleOverridePick = async (taskId) => {
    await setOverride(taskId, overrideSlot)
    setOverrideSlot(null)
  }

  return (
    <div className="home-session-screen">
      <div className="full-list-header">
        <h1>Today's Top 3</h1>
        <button type="button" className="capture-button" onClick={() => setCaptureOpen(true)}>
          + Capture task
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : topThree.length === 0 ? (
        <p>No open tasks — capture one to get started.</p>
      ) : (
        <div className="top-three-list">
          {topThree.map((task, i) => (
            <TopThreeCard
              key={task.id}
              task={task}
              slot={i + 1}
              onStart={handleStart}
              onOverride={setOverrideSlot}
            />
          ))}
        </div>
      )}

      {starting && <p>Starting session...</p>}

      {captureOpen && (
        <TaskCaptureModal onClose={() => setCaptureOpen(false)} onCreate={handleCreate} />
      )}

      {overrideSlot && (
        <ManualOverridePicker
          slot={overrideSlot}
          tasks={tasks}
          onPick={handleOverridePick}
          onClose={() => setOverrideSlot(null)}
        />
      )}
    </div>
  )
}

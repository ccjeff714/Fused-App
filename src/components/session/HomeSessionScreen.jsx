import { useState, useMemo } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useTopThree } from '../../hooks/useTopThree'
import { todayISO } from '../../lib/date'
import TopThreeCard from './TopThreeCard'
import AlsoTodayCard from './AlsoTodayCard'
import ManualOverridePicker from './ManualOverridePicker'
import TaskCaptureModal from '../tasks/TaskCaptureModal'
import TaskDetailPanel from '../tasks/TaskDetailPanel'

export default function HomeSessionScreen({
  session, startSession, onSessionStarted, captureOpen, onCloseCapture,
  roles, createRole, projects,
}) {
  const { tasks, createTask, updateTask } = useTasks(session)
  const { topThree, loading, error, setOverride, refetch } = useTopThree(session)
  const [swapSlot, setSwapSlot] = useState(null)
  const [panelTaskId, setPanelTaskId] = useState(null)
  const [starting, setStarting] = useState(false)

  const topThreeIds = useMemo(() => new Set(topThree.map((t) => t.id)), [topThree])
  const alsoToday = useMemo(
    () => tasks.filter((t) => t.planned_date === todayISO() && t.status !== 'done' && !topThreeIds.has(t.id)),
    [tasks, topThreeIds]
  )
  const panelTask = tasks.find((t) => t.id === panelTaskId) ?? null

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

  const handleSwapPick = async (taskId) => {
    await setOverride(taskId, swapSlot)
    setSwapSlot(null)
  }

  const handleUpdate = async (taskId, fields) => {
    const result = await updateTask(taskId, fields)
    if (!result.error) refetch()
    return result
  }

  return (
    <main className="screen">
      <header>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Today</div>
        <h1 className="screen-title">Today's Top 3</h1>
        <p className="screen-subtitle">Three tasks, chosen by due date and priority. Start one and everything else gets out of the way.</p>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : topThree.length === 0 ? (
        <p>No open tasks — capture one to get started.</p>
      ) : (
        <div className="task-grid" style={{ maxWidth: 860 }}>
          {topThree.map((task, i) => (
            <TopThreeCard
              key={task.id}
              task={task}
              slot={i + 1}
              onStart={handleStart}
              onSwap={setSwapSlot}
              onOpen={(t) => setPanelTaskId(t.id)}
            />
          ))}
        </div>
      )}

      {alsoToday.length > 0 && (
        <div className="also-today-section">
          <div className="also-today-header">Also today</div>
          <div className="task-grid">
            {alsoToday.map((task) => (
              <AlsoTodayCard
                key={task.id}
                task={task}
                onStart={handleStart}
                onUpdate={handleUpdate}
                onOpen={(t) => setPanelTaskId(t.id)}
              />
            ))}
          </div>
        </div>
      )}

      {starting && <p>Starting session...</p>}

      {captureOpen && (
        <TaskCaptureModal
          onClose={onCloseCapture}
          onCreate={handleCreate}
          projects={projects}
          roles={roles}
          onCreateRole={createRole}
        />
      )}

      {swapSlot && (
        <ManualOverridePicker
          slot={swapSlot}
          tasks={tasks}
          onPick={handleSwapPick}
          onClose={() => setSwapSlot(null)}
        />
      )}

      {panelTask && (
        <TaskDetailPanel
          key={panelTask.id}
          task={panelTask}
          projects={projects}
          roles={roles}
          onUpdate={handleUpdate}
          onCreateRole={createRole}
          onClose={() => setPanelTaskId(null)}
          onStart={handleStart}
        />
      )}
    </main>
  )
}

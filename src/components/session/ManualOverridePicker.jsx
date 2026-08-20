export default function ManualOverridePicker({ slot, tasks, onPick, onClose }) {
  const eligible = tasks.filter((t) => t.status !== 'done')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Swap slot {slot}</h2>

        {eligible.length === 0 ? (
          <p>No other tasks available.</p>
        ) : (
          <div className="override-picker-list">
            {eligible.map((task) => (
              <button
                key={task.id}
                type="button"
                className="override-picker-item"
                onClick={() => onPick(task.id)}
              >
                <span>{task.title}</span>
                <span className="due-date">{task.due_date ? task.due_date : 'no due date'}</span>
              </button>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

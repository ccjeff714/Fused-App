import { useState } from 'react'
import { IconX, IconPlus } from '../icons'

// Lightweight checklist editor for tasks.subtasks — a jsonb array of
// {text, done} objects (Phase5_Handoff_Spec.md §9), not a relational
// structure. No due date/priority/session per item by design: those
// fields simply aren't exposed here.
export default function SubtaskList({ subtasks, onChange }) {
  const [draft, setDraft] = useState('')
  const items = subtasks ?? []

  const addItem = () => {
    const text = draft.trim()
    if (!text) return
    onChange([...items, { text, done: false }])
    setDraft('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    }
  }

  const toggleItem = (index) => {
    onChange(items.map((item, i) => (i === index ? { ...item, done: !item.done } : item)))
  }

  const editItemText = (index, text) => {
    onChange(items.map((item, i) => (i === index ? { ...item, text } : item)))
  }

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="subtask-list">
      {items.map((item, index) => (
        <div key={index} className={item.done ? 'subtask-item done' : 'subtask-item'}>
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => toggleItem(index)}
            aria-label={`Mark "${item.text}" ${item.done ? 'not done' : 'done'}`}
          />
          <input
            type="text"
            value={item.text}
            onChange={(e) => editItemText(index, e.target.value)}
          />
          <button
            type="button"
            className="subtask-remove"
            onClick={() => removeItem(index)}
            aria-label={`Remove "${item.text}"`}
          >
            <IconX size={14} />
          </button>
        </div>
      ))}

      {/* Deliberately not a <form> — this renders inside TaskEditModal's
          own outer <form>, and a nested <form> is invalid HTML whose
          submit routing isn't reliable across browsers (the root cause of
          the "Add just refreshes the page, nothing saved" bug). See
          RoleSelect.jsx for the same fix applied to role creation. */}
      <div className="subtask-add-row">
        <input
          type="text"
          placeholder="Add a checklist item"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="btn btn-outline btn-sm" disabled={!draft.trim()} onClick={addItem}>
          <IconPlus size={14} />
        </button>
      </div>
    </div>
  )
}

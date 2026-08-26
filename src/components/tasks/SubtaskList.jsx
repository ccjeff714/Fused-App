import { useState } from 'react'
import { IconX, IconPlus } from '../icons'

// Lightweight checklist editor for tasks.subtasks — a jsonb array of
// {text, done} objects (Phase5_Handoff_Spec.md §9), not a relational
// structure. No due date/priority/session per item by design: those
// fields simply aren't exposed here.
export default function SubtaskList({ subtasks, onChange }) {
  const [draft, setDraft] = useState('')
  const items = subtasks ?? []

  const addItem = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    onChange([...items, { text, done: false }])
    setDraft('')
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

      <form className="subtask-add-row" onSubmit={addItem}>
        <input
          type="text"
          placeholder="Add a checklist item"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn btn-outline btn-sm" disabled={!draft.trim()}>
          <IconPlus size={14} />
        </button>
      </form>
    </div>
  )
}

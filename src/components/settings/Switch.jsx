export default function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={checked ? 'switch on' : 'switch'}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <span className="switch-knob" />
    </button>
  )
}

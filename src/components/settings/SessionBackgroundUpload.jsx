import { useState, useEffect, useRef } from 'react'
import { uploadSessionBackground, resolveSessionBackgroundUrl } from '../../lib/sessionBackground'

// Uploads to the session-backgrounds bucket under {user_id}/ and writes the
// storage path into profiles.settings.session_background_url via
// useSettings — wires SessionField's backgroundImage fallback
// (Phase2_Handoff_Spec.md A6a).
export default function SessionBackgroundUpload({ session, settings, updateSettings }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    resolveSessionBackgroundUrl(settings.session_background_url).then((url) => {
      if (!cancelled) setPreviewUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [settings.session_background_url])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const { path, error } = await uploadSessionBackground(session.user.id, file)
    if (error) {
      setError(error.message)
      setUploading(false)
      return
    }
    await updateSettings({ session_background_url: path })
    setUploading(false)
  }

  return (
    <div className="session-bg-upload">
      <div className="session-bg-preview" style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 'var(--text-md)' }}>Session background</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
          Falls back to a green gradient until you add one.
        </span>
      </div>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        style={{ marginLeft: 'auto' }}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload image'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

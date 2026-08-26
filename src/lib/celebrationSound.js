// success_sound_effect is a real, live setting but no audio asset exists
// anywhere in the repo or design bundle (Phase2_Handoff_Spec.md A3b) —
// leave it silent: reference a static path and let a missing file fail
// silently, no error surfaced to the user.
const SUCCESS_SOUND_PATH = '/assets/sounds/success.mp3'

export function playSuccessSound() {
  try {
    const audio = new Audio(SUCCESS_SOUND_PATH)
    audio.play().catch(() => {
      // no asset configured yet — silent, by design
    })
  } catch {
    // Audio() unsupported or blocked — silent, by design
  }
}

const TTS_ENABLED_KEY = 'tts_enabled'

class TTSController {
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TTS_ENABLED_KEY)
      this.enabled = stored === null ? true : stored === '1'
    }
  }

  speak(text: string, onEnd?: () => void) {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd()
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.9
    utterance.pitch = 1.1

    // Tentar usar voz brasileira se disponível
    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find(v => v.lang.startsWith('pt'))
    if (ptVoice) {
      utterance.voice = ptVoice
    }

    if (onEnd) {
      utterance.onend = onEnd
    }

    window.speechSynthesis.speak(utterance)
  }

  cancel() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem(TTS_ENABLED_KEY, enabled ? '1' : '0')
    }
    if (!enabled) {
      this.cancel()
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }
}

export const ttsController = new TTSController()

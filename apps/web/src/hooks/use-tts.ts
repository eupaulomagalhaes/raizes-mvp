import { useEffect } from 'react'
import { ttsController } from '@/lib/tts'

export function useTTS() {
  return {
    speak: (text: string) => ttsController.speak(text),
    cancel: () => ttsController.cancel(),
    setEnabled: (enabled: boolean) => ttsController.setEnabled(enabled),
    isEnabled: () => ttsController.isEnabled()
  }
}

export function useTTSAnnounce(text: string, deps: any[] = []) {
  useEffect(() => {
    if (text) {
      ttsController.speak(text)
    }
    return () => ttsController.cancel()
  }, [text, ...deps])
}

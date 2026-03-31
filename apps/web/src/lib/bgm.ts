import { STORAGE } from './storage'

const BGM_STATE_KEY = 'bgm_enabled'

class BGMController {
  private audio: HTMLAudioElement | null = null
  private enabled: boolean = true
  private listeners: Set<(enabled: boolean, playing: boolean) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(BGM_STATE_KEY)
      this.enabled = stored === null ? true : stored === '1'
    }
  }

  private getAudio(): HTMLAudioElement {
    if (!this.audio && typeof window !== 'undefined') {
      this.audio = new Audio(STORAGE.audio.bgm)
      this.audio.loop = true
      this.audio.volume = 0.5
      this.audio.addEventListener('play', () => this.notify())
      this.audio.addEventListener('pause', () => this.notify())
    }
    return this.audio!
  }

  async play() {
    if (!this.enabled) return
    try {
      const audio = this.getAudio()
      await audio.play()
    } catch (error) {
      console.log('BGM autoplay blocked, waiting for user interaction')
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause()
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem(BGM_STATE_KEY, enabled ? '1' : '0')
    }
    if (enabled) {
      this.play()
    } else {
      this.pause()
    }
    this.notify()
  }

  toggle() {
    this.setEnabled(!this.enabled)
  }

  isEnabled(): boolean {
    return this.enabled
  }

  isPlaying(): boolean {
    return !!(this.audio && !this.audio.paused && this.audio.currentTime > 0)
  }

  subscribe(callback: (enabled: boolean, playing: boolean) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notify() {
    const enabled = this.isEnabled()
    const playing = this.isPlaying()
    this.listeners.forEach(cb => cb(enabled, playing))
  }
}

export const bgmController = new BGMController()

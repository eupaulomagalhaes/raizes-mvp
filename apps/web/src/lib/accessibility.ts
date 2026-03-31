// Acessibilidade - ARIA live announcements e focus trap

let liveRegion: HTMLDivElement | null = null

export function initA11y() {
  if (typeof window === 'undefined') return
  if (liveRegion) return

  liveRegion = document.createElement('div')
  liveRegion.setAttribute('aria-live', 'polite')
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.className = 'sr-only'
  Object.assign(liveRegion.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap'
  })
  document.body.appendChild(liveRegion)
}

export function announce(message: string) {
  if (!liveRegion) initA11y()
  if (!liveRegion) return

  liveRegion.textContent = ''
  setTimeout(() => {
    liveRegion!.textContent = message
  }, 100)
}

export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  if (focusableElements.length === 0) return () => {}

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  return () => container.removeEventListener('keydown', handleKeyDown)
}

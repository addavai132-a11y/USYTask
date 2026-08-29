'use client'

import { useEffect, useRef } from 'react'

/**
 * useModalBackHandler
 * Intercepts mobile native back gesture (iOS swipe back / Android back button / popstate)
 * so that going back closes the open modal instead of navigating away from the current tab.
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return

    const stateId = `modal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    let isPoppedByPopState = false

    // Push a state into browser history for this modal
    window.history.pushState({ usyModal: stateId }, '')

    const handlePopState = () => {
      isPoppedByPopState = true
      onCloseRef.current()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)

      // If the modal is closed by UI action (Cancel, backdrop click, save, etc.),
      // revert the history entry so we don't leave zombie history states
      if (!isPoppedByPopState && window.history.state?.usyModal === stateId) {
        window.history.back()
      }
    }
  }, [isOpen])
}

'use client'

import { useEffect } from 'react'

/**
 * TrustedTypesInit — Inicializa de forma segura la política 'default' de Trusted Types
 * en navegadores Chromium que la soporten para prevenir excepciones en tiempo de ejecución
 * cuando la directiva `require-trusted-types-for 'script'` está activa en la CSP.
 */
export function TrustedTypesInit() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'trustedTypes' in window) {
      try {
        const tt = (window as any).trustedTypes
        if (tt && typeof tt.createPolicy === 'function' && !tt.defaultPolicy) {
          tt.createPolicy('default', {
            createHTML: (string: string) => string,
            createScript: (string: string) => string,
            createScriptURL: (string: string) => string,
          })
        }
      } catch {
        // Ignorar si la política ya fue inicializada por el bundler o el navegador
      }
    }
  }, [])

  return null
}

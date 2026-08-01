import { useEffect, useRef } from 'react'

/**
 * Creates a <style> tag once (on mount) and removes it on unmount, returning
 * a setter to update its content in place — the React equivalent of
 * VueUse's useStyleTag, since a dynamically injected style tag can't be
 * driven directly through JSX (it targets raw HTML injected via
 * dangerouslySetInnerHTML, which React doesn't otherwise reach into).
 */
export function useStyleTag(id: string) {
  const elRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.id = id
    document.head.appendChild(styleEl)
    elRef.current = styleEl

    return () => {
      styleEl.remove()
      elRef.current = null
    }
  }, [id])

  const setCss = (css: string) => {
    if (elRef.current) elRef.current.textContent = css
  }

  return setCss
}

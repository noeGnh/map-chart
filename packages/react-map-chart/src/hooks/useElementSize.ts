import { useEffect, useState } from 'react'

/**
 * Tracks an element's size via ResizeObserver. Takes a callback-ref setter
 * (not a plain useRef) because the target element mounts/unmounts
 * conditionally (the tooltip only exists in the DOM while hovering a valid
 * area) — a plain ref wouldn't re-trigger the effect when the node appears.
 */
export function useElementSize() {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!node) return

    const updateSize = () => setSize({ width: node.offsetWidth, height: node.offsetHeight })
    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(node)

    return () => observer.disconnect()
  }, [node])

  return { ref: setNode, size }
}

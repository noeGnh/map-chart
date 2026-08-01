import { useEffect, useState } from 'react'

/**
 * Page-relative mouse position (pageX/pageY, i.e. including scroll) —
 * matches VueUse's useMouse() default, which the tooltip position math in
 * @map-chart/core expects (it converts page coordinates to viewport
 * coordinates itself via scrollX/scrollY).
 */
export function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.pageX, y: event.pageY })
    }

    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  return position
}

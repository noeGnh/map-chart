import type { CSSProperties } from 'react'

export interface TooltipProps {
  id?: string
  className?: string
  style?: CSSProperties
  label: string
  value: string
  bgColor?: string
  textColor?: string
  dividerColor?: string
  innerRef?: (node: HTMLDivElement | null) => void
}

export function Tooltip({
  id,
  className,
  style,
  label,
  value,
  bgColor = 'rgba(0, 0, 0, 0.5)',
  textColor = '#fff',
  dividerColor = 'rgba(255, 255, 255, 0.5)',
  innerRef,
}: TooltipProps) {
  return (
    <div
      id={id}
      ref={innerRef}
      className={['v3mc-tooltip-wrapper', className].filter(Boolean).join(' ')}
      style={{ ...style, backgroundColor: bgColor, color: textColor }}>
      <span className="v3mc-tooltip-label"> {label} </span>
      {value && (
        <>
          <div
            className="v3mc-tooltip-divider"
            style={{ backgroundColor: dividerColor }}></div>
          <span className="v3mc-tooltip-value"> {value} </span>
        </>
      )}
    </div>
  )
}

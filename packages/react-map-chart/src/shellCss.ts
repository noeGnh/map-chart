export interface ShellCssOptions {
  containerId: string
  width: string
  height: string
  defaultStrokeColor: string
  defaultFillColor: string
  defaultCursor: string
  defaultFillHoverColor: string
  defaultStrokeHoverColor: string
}

/**
 * The map's "shell" styling (sizing, base stroke/fill, hover, cursor) has to
 * target the SVG injected via dangerouslySetInnerHTML, which React's `style`
 * prop can't reach into — Vue handles this with scoped `v-bind()` CSS, React
 * has no equivalent, so it's generated as plain CSS text targeting the
 * container id instead (injected via the same per-instance <style> tag used
 * for the data-driven per-area fill rules from @map-chart/core).
 */
export function buildShellCss(options: ShellCssOptions): string {
  return (
    ` #${options.containerId} > svg { height: ${options.height}; width: ${options.width}; stroke: ${options.defaultStrokeColor}; fill: ${options.defaultFillColor}; stroke-width: 0.4px; } ` +
    ` #${options.containerId} > svg > path { cursor: ${options.defaultCursor}; } ` +
    ` #${options.containerId} > svg > path:hover { fill: ${options.defaultFillHoverColor}; stroke: ${options.defaultStrokeHoverColor}; stroke-width: 0.5px; } `
  )
}

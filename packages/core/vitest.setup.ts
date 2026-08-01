// jsdom doesn't implement SVGGraphicsElement#getBBox — renderAreaLabels relies
// on it, so tests never exercise that path without this.
if (!('getBBox' in SVGElement.prototype)) {
  // @ts-expect-error jsdom-only polyfill, not a spec-accurate SVGRect
  SVGElement.prototype.getBBox = () => ({
    x: 0,
    y: 0,
    width: 10,
    height: 10,
  })
}

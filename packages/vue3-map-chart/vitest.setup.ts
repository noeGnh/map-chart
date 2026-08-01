// jsdom doesn't implement SVGGraphicsElement#getBBox — MapChart's label
// placement code relies on it, so tests never exercise that path without this.
if (!('getBBox' in SVGElement.prototype)) {
  // @ts-expect-error jsdom-only polyfill, not a spec-accurate SVGRect
  SVGElement.prototype.getBBox = () => ({
    x: 0,
    y: 0,
    width: 10,
    height: 10,
  })
}

// jsdom doesn't implement ResizeObserver, used internally by VueUse's
// useElementBounding/useMouseInElement.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {
      return undefined
    }
    unobserve() {
      return undefined
    }
    disconnect() {
      return undefined
    }
  }

  // @ts-expect-error jsdom-only stub
  globalThis.ResizeObserver = ResizeObserverStub
}

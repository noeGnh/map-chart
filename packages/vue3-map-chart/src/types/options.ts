export interface Options {
  name?: string
  // Values are the raw SVG strings exported for each built-in map (see
  // index.ts, `?raw` imports), not real Vue components — MapChart reads them
  // off the vnode `type` without ever mounting them. Not `Component` despite
  // what `plugin.ts` hands to `app.component()`.
  maps?: Record<string, string>
}

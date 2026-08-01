export interface Options {
  name?: string
  // Values are the `{ name, template }` placeholders exported for each built-in
  // map (see index.ts), not real Vue components — MapChart reads them off the
  // vnode `type` without ever mounting them. Not `Component` despite what
  // `plugin.ts` hands to `app.component()`.
  maps?: Record<string, { name: string; template: string }>
}

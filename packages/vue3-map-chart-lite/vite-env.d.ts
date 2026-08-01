/// <reference types="vite/client" />

// Injected at build time (see vite.config.ts) from this package's own version,
// used to pin the runtime map fetch to an immutable release instead of a
// mutable branch.
declare const __V3MC_VERSION__: string
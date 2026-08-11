# Map Chart

Drop-in components for displaying dynamic data on world, continent, and country maps — no D3, no topojson, no geo knowledge required. Available for both Vue 3 and React.

<p align="center">
<img width="600" alt="Demo GIF" src="https://github.com/noeGnh/vue3-map-chart/blob/master/demo.gif"/>
</p>

Pick one of the four packages below and head to its README for the full API. They all share the same props, the same ~264 built-in maps, and the same behavior — only the framework glue differs.

| Package                                                                                    | Framework | Maps                            | Bundle           |
| -------------------------------------------------------------------------------------------- | --------- | -------------------------------- | ----------------- |
| [`vue3-map-chart`](packages/vue3-map-chart) ![npm](https://img.shields.io/npm/v/vue3-map-chart) | Vue 3     | Bundled locally                  | Larger, offline-capable |
| [`vue3-map-chart-lite`](packages/vue3-map-chart-lite) ![npm](https://img.shields.io/npm/v/vue3-map-chart-lite) | Vue 3     | Fetched from a CDN at runtime    | Lightweight        |
| [`@arkn/react-map-chart`](packages/react-map-chart) ![npm](https://img.shields.io/npm/v/@arkn/react-map-chart) | React     | Bundled locally                  | Larger, offline-capable |
| [`@arkn/react-map-chart-lite`](packages/react-map-chart-lite) ![npm](https://img.shields.io/npm/v/@arkn/react-map-chart-lite) | React     | Fetched from a CDN at runtime    | Lightweight        |

Not sure which one you need? Full if you want every map available offline with the fastest possible render; lite if you only use a handful of maps and want the smallest bundle — both cache what they fetch, so the difference is mostly about the first load.

## Quick start

### Vue

```sh
pnpm add vue3-map-chart # or vue3-map-chart-lite
```

```vue
<script setup>
import { MapChart, WorldMap } from 'vue3-map-chart'
import 'vue3-map-chart/dist/style.css'

const data = { DE: 95, FR: 47, GB: 10 }
</script>

<template>
  <MapChart :data="data">
    <WorldMap />
  </MapChart>
</template>
```

### React

```sh
pnpm add @arkn/react-map-chart # or @arkn/react-map-chart-lite
```

```tsx
import { MapChart, WorldMap } from '@arkn/react-map-chart'
import '@arkn/react-map-chart/dist/style.css'

const data = { DE: 95, FR: 47, GB: 10 }

function App() {
  return (
    <MapChart data={data}>
      <WorldMap />
    </MapChart>
  )
}
```

Full prop/event reference, custom SVG maps, and more examples are in each package's own README (linked in the table above).

## Demo

- Vue: [live demo](https://noegnh.github.io/vue3-map-chart/) — [source](packages/playground-vue)
- React: [source](packages/playground-react) (run `pnpm dev-react` locally)

## Repository layout

This is a pnpm monorepo. The four public packages above sit on top of a shared, private, unpublished `packages/core` — the ~264 SVG maps, coloring/sanitization logic, tooltip and label positioning math, and the lite packages' fetch+cache pipeline all live there once; each framework package is a thin wrapper around it.

```text
packages/
  core/                   private, framework-agnostic (not published)
  vue3-map-chart/         Vue, full
  vue3-map-chart-lite/    Vue, lite
  react-map-chart/        React, full
  react-map-chart-lite/   React, lite
  playground-vue/         Vue demo app
  playground-react/       React demo app
  docs/                   VitePress docs site
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

```sh
pnpm install
pnpm test    # all packages
pnpm lint
pnpm build   # all packages + both playgrounds + docs
```

## Credits

This package uses SVG maps from [`amCharts`](https://www.amcharts.com/)

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/noeGnh/vue3-map-chart/releases).

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/noeGnh/vue3-map-chart/blob/master/LICENSE)

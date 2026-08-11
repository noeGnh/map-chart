# Vue 3 Map Chart ![npm (scoped)](https://img.shields.io/npm/v/vue3-map-chart)

A Vue JS Component for displaying dynamic data on a world, continents and countries maps.

<p align="center">
<img width="600" alt="Demo GIF" src="https://github.com/noeGnh/vue3-map-chart/blob/master/demo.gif"/>
</p>

## Installation

There are two versions of this package: `vue3-map-chart` and `vue3-map-chart-lite`. The `vue3-map-chart-lite` version loads maps dynamically from a CDN at runtime, so they are not bundled with your application. This keeps your build lightweight, ideal for users who only need a few maps or want to reduce initial load time. On the other hand, the full `vue3-map-chart` version includes all maps locally, offering faster access and offline support at the cost of a larger bundle size.

Built-in maps are fetched from jsDelivr, pinned to the exact `vue3-map-chart-lite` version you have installed (never a mutable branch), sanitized with [DOMPurify](https://github.com/cure53/DOMPurify) before being rendered, and cached in `localStorage` for 28 days.

If you are using npm:

```sh
npm i vue3-map-chart # or: npm i vue3-map-chart-lite
```

If you are using yarn:

```sh
yarn add vue3-map-chart # or: yarn add vue3-map-chart-lite
```

If you are using pnpm:

```sh
pnpm add vue3-map-chart # or: pnpm add vue3-map-chart-lite
```

## Demo

View the live demo [`here`](https://noegnh.github.io/vue3-map-chart/) and demo source code [`here`](https://github.com/noeGnh/vue3-map-chart/blob/master/packages/playground-vue/).

## Usage

You can add this package globally to your project:

```js
// main.js
import { createApp } from 'vue'
import Vue3MapChart from 'vue3-map-chart'
import 'vue3-map-chart/dist/style.css'

import App from './App.vue'

createApp(App).use(Vue3MapChart).mount('#app')
```

If needed rename component to use:

```js
createApp(App).use(Vue3MapChart, { name: 'MyMapChart' }).mount('#app') // use in template <MyMapChart />
```

If needed register some maps globally:

```js
import Vue3MapChart, { GermanyMap, JapanMap } from 'vue3-map-chart'

createApp(App)
  .use(Vue3MapChart, { maps: { GermanyMap, Japan: JapanMap } })
  .mount('#app')
```

Map list can be found [`here`](https://github.com/noeGnh/vue3-map-chart/blob/master/packages/vue3-map-chart/map-list.txt)

Alternatively you can also import the components locally:

```js
<script setup>
 import { MapChart, AfricaMap, AsiaMap, BrazilMap, EgyptMap, EuropeMap, NorthAmericaMap } from 'vue3-map-chart'
 import 'vue3-map-chart/dist/style.css'
</script>
```

This component is most useful for creating heat maps of countries and their subdivisions. It colors each country or subdivision differently based on the props provided.

The component requires a prop of data to be passed to it, which is a JS object formatted like so.

```js
<script setup>
 import { MapChart, WorldMap } from 'vue3-map-chart'

 const data = {
    DE: 95,
    FR: 47,
    GB: 10,
 }
</script>
```

Or if for some reasons you want to customize each country color.

```js
<script setup>
 import { MapChart, WorldMap } from 'vue3-map-chart'

 const data = {
    AU: {
      color: 'blue',
      value: 58,
    },
    NZ: {
      color: '#339601',
      value: 42,
    },
    ID: {
      color: '#F7931E',
      value: 62,
    },
 }
</script>
```

The key must be a valid [ISO 3166-1 country code](https://en.wikipedia.org/wiki/ISO_3166-1) or a [ISO 3166-2 subdivision code](https://en.wikipedia.org/wiki/ISO_3166-2). You can then use the component directly in your template and pass the map you want to display as a default slot.

```html
<template>
  <MapChart :data="data">
    <WorldMap />
  </MapChart>
</template>
```

## Props

| Name                    | Type                                                              | Description                                                                                                                                         | Default                    | Required |
| ----------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------- |
| data                    | number / { value?: number, color?: string, legendLabel?: string } | See Usage Section above for details                                                                                                                 | undefined                  | Yes      |
| baseColor               | string                                                            | Color use for data representation                                                                                                                   | '#0782c5'                  | No       |
| langCode                | string                                                            | The language of countries name, subdivisions name is not supported                                                                                  | 'en'                       | No       |
| width                   | number / string                                                   | Width of map                                                                                                                                        | '100%'                     | No       |
| height                  | number / string                                                   | Height of map                                                                                                                                       | 500                        | No       |
| mapStyles               | CSSProperties                                                     | Styles applied to map                                                                                                                               | {}                         | No       |
| displayLegend           | boolean                                                           | Display legend when mouse passes hover area on map                                                                                                  | true                       | No       |
| displayLegendWhenEmpty  | boolean                                                           | Do not display legend when area value is empty                                                                                                      | true                       | No       |
| areaNameOnMap           | 'none' / 'all' / 'data-only'                                      | Display area name on map                                                                                                                            | 'none'                     | No       |
| areaNameOnMapSize       | number                                                            | Font size of area name on map                                                                                                                       | 12                         | No       |
| areaNameOnMapColor      | string                                                            | Color of area name on map                                                                                                                           | '#ffffff'                  | No       |
| areaNameOnMapBgColor.   | string                                                            | Background color of area name on map                                                                                                                | 'rgba(0, 0, 0, 0.6)'       | No       |
| legendBgColor           | string                                                            | Color of legend tooltip box                                                                                                                         | 'rgba(0, 0, 0, 0.5)'       | No       |
| legendTextColor         | string                                                            | Color of legend text                                                                                                                                | '#fff'                     | No       |
| legendDividerColor      | string                                                            | Color of legend divider                                                                                                                             | 'rgba(255, 255, 255, 0.5)' | No       |
| legendValuePrefix       | string                                                            | Prefix added to value displayed on legend                                                                                                           | ''                         | No       |
| legendValueSuffix       | string                                                            | Suffix added to value displayed on legend                                                                                                           | ''                         | No       |
| defaultStrokeColor      | string                                                            | Default map stroke color                                                                                                                            | 'rgb(200, 200, 200)'       | No       |
| defaultStrokeHoverColor | string                                                            | Default map stroke hover color                                                                                                                      | 'rgb(200, 200, 200)'       | No       |
| defaultFillColor        | string                                                            | Default map fill color                                                                                                                              | 'rgb(236, 236, 236)'       | No       |
| defaultFillHoverColor   | string                                                            | Default map fill hover color                                                                                                                        | 'rgb(226, 226, 226)'       | No       |
| formatValueWithSiPrefix | boolean                                                           | Formats a number with a magnitude suffix                                                                                                            | false                      | No       |
| forceCursorPointer      | boolean                                                           | Force the cursor to be in pointer mode even when the legend display is disabled                                                                     | false                      | No       |
| loaderColor             | string                                                            | Color of the loader (Only for lite version)                                                                                                         | '#3498db'                  | No       |
| customMapSvg            | string                                                            | Raw SVG string (imported with `?raw` or defined inline). When provided, overrides the built-in maps. See [example](#example-using-a-custom-svg-map) | undefined                  | No       |
| sanitizeCustomMapSvg    | boolean                                                           | Sanitize `customMapSvg` with DOMPurify before rendering it. Disable only if you trust the source and need markup DOMPurify would strip              | true                       | No       |
| customMapLabels         | Record<string, string>                                            | Maps SVG `id`s to display names for tooltips. Used with `customMapSvg`. See [example](#example-using-a-custom-svg-map)                              | undefined                  | No       |

## Slots

| Name    | Description                                                                |
| ------- | -------------------------------------------------------------------------- |
| default | The map you want to display.                                               |
| loader  | Custom loader to display while the map is loading. (Only for lite version) |

## Events

- mapItemClick
  - This event is fired when an map area is clicked.

- mapItemMouseout
  - This event is fired when the mouse leaves a map area.

- mapItemMouseover
  - This event is fired when the mouse passes over the top of an map area.

```js
<script setup>
 import { MapChart, WorldMap } from 'vue3-map-chart'

 const data = {
    US: 43,
    CA: 63,
    GB: 20,
 }

  const onMapItemClick = (areaId, areaValue) => {
    //
  }

  const onMapItemMouseout = (areaId, areaValue) => {
    //
  }

  const onMapItemMouseover = (areaId, areaValue) => {
    //
  }
</script>
```

```html
<template>
  <MapChart
    :data="data"
    @map-item-click="onMapItemClick"
    @map-item-mouseover="onMapItemMouseover">
    <WorldMap />
  </MapChart>
</template>
```

## Example: Using a custom SVG map

```ts
// Import SVG as raw string using vite-plugin-svg-loader
import myMapSvg from './maps/my-map.svg?raw'

const labels = {
  region1: 'North Zone',
  region2: 'East District',
}

const data = {
  region1: 150,
  region2: 300,
}
```

```html
<template>
  <MapChart
    :custom-map-svg="myMapSvg"
    :custom-map-labels="labels"
    :data="data" />
</template>
```

> Each `code` in the `data` array must match an `id` attribute in the SVG’s `<path>` elements.
> Tooltips will display labels from `custom-map-labels` if available.

## Credits

This package uses SVG maps from [`amCharts`](https://www.amcharts.com/)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/noeGnh/vue3-map-chart/releases).

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/noeGnh/vue3-map-chart/blob/master/LICENSE)

# React Map Chart ![npm (scoped)](https://img.shields.io/npm/v/@arkn/react-map-chart-lite)

A React component for displaying dynamic data on a world, continents and countries maps.

<p align="center">
<img width="600" alt="Demo GIF" src="https://github.com/noeGnh/map-chart/blob/master/demo.gif"/>
</p>

## Installation

There are two versions of this package: `@arkn/react-map-chart` and `@arkn/react-map-chart-lite`. The `@arkn/react-map-chart-lite` version loads maps dynamically from a CDN at runtime, so they are not bundled with your application. This keeps your build lightweight, ideal for users who only need a few maps or want to reduce initial load time. On the other hand, the full `@arkn/react-map-chart` version includes all maps locally, offering faster access and offline support at the cost of a larger bundle size.

Built-in maps are fetched from jsDelivr, pinned to the exact `@arkn/react-map-chart-lite` version you have installed (never a mutable branch), sanitized with [DOMPurify](https://github.com/cure53/DOMPurify) before being rendered, and cached in `localStorage` for 28 days.

If you are using npm:

```sh
npm i @arkn/react-map-chart # or: npm i @arkn/react-map-chart-lite
```

If you are using yarn:

```sh
yarn add @arkn/react-map-chart # or: yarn add @arkn/react-map-chart-lite
```

If you are using pnpm:

```sh
pnpm add @arkn/react-map-chart # or: pnpm add @arkn/react-map-chart-lite
```

## Demo

View the live demo [`here`](https://noegnh.github.io/map-chart/) and demo source code [`here`](https://github.com/noeGnh/map-chart/blob/master/packages/playground-react/).

## Usage

Import the components you need directly — there's no plugin or global registration step, just import and use like any other React component:

```tsx
import { MapChart, AfricaMap, AsiaMap, BrazilMap, EgyptMap, EuropeMap, NorthAmericaMap } from '@arkn/react-map-chart-lite'
import '@arkn/react-map-chart-lite/dist/style.css'
```

Map list can be found [`here`](https://github.com/noeGnh/map-chart/blob/master/packages/core/map-list.txt)

This component is most useful for creating heat maps of countries and their subdivisions. It colors each country or subdivision differently based on the props provided.

The component requires a `data` prop, which is a JS object formatted like so.

```tsx
import { MapChart, WorldMap } from '@arkn/react-map-chart-lite'

const data = {
  DE: 95,
  FR: 47,
  GB: 10,
}
```

Or if for some reason you want to customize each country's color:

```tsx
import { MapChart, WorldMap } from '@arkn/react-map-chart-lite'

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
```

The key must be a valid [ISO 3166-1 country code](https://en.wikipedia.org/wiki/ISO_3166-1) or a [ISO 3166-2 subdivision code](https://en.wikipedia.org/wiki/ISO_3166-2). You can then use the component directly in your JSX and pass the map you want to display as a child.

```tsx
function App() {
  return (
    <MapChart data={data}>
      <WorldMap />
    </MapChart>
  )
}
```

> `<WorldMap />` (and every other map export) is never actually rendered — `MapChart` reads it back off the element to know which map to fetch. It's fine (and expected) for it to type-check as a component while not behaving like one.

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
| areaNameOnMapBgColor    | string                                                            | Background color of area name on map                                                                                                                | 'rgba(0, 0, 0, 0.6)'       | No       |
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
| loaderColor             | string                                                            | Color of the default loading spinner                                                                                                                | '#3498db'                  | No       |
| loader                  | ReactNode                                                         | Custom content to display while a built-in map is loading, instead of the default spinner                                                          | undefined                  | No       |
| customMapSvg            | string                                                            | Raw SVG string (imported with `?raw` or defined inline). When provided, overrides the built-in maps. See [example](#example-using-a-custom-svg-map) | undefined                  | No       |
| sanitizeCustomMapSvg    | boolean                                                           | Sanitize `customMapSvg` with DOMPurify before rendering it. Disable only if you trust the source and need markup DOMPurify would strip              | true                       | No       |
| customMapLabels         | Record<string, string>                                            | Maps SVG `id`s to display names for tooltips. Used with `customMapSvg`. See [example](#example-using-a-custom-svg-map)                              | undefined                  | No       |
| children                | ReactNode                                                         | The map you want to display, e.g. `<WorldMap />`. Ignored when `customMapSvg` is set                                                                | undefined                  | No       |

## Events

Events are plain callback props instead of a Vue-style event-emitter:

- `onMapItemClick`
  - Called when a map area is clicked.

- `onMapItemMouseout`
  - Called when the mouse leaves a map area.

- `onMapItemMouseover`
  - Called when the mouse passes over the top of a map area.

Each callback receives `(id: string | null, value: number | MapDataValue | null | undefined)`.

```tsx
import { MapChart, WorldMap } from '@arkn/react-map-chart-lite'

const data = {
  US: 43,
  CA: 63,
  GB: 20,
}

function App() {
  const onMapItemClick = (areaId, areaValue) => {
    //
  }

  const onMapItemMouseover = (areaId, areaValue) => {
    //
  }

  return (
    <MapChart data={data} onMapItemClick={onMapItemClick} onMapItemMouseover={onMapItemMouseover}>
      <WorldMap />
    </MapChart>
  )
}
```

## Example: Using a custom SVG map

```tsx
// Import SVG as raw string via Vite's ?raw suffix
import myMapSvg from './maps/my-map.svg?raw'

const labels = {
  region1: 'North Zone',
  region2: 'East District',
}

const data = {
  region1: 150,
  region2: 300,
}

function App() {
  return <MapChart customMapSvg={myMapSvg} customMapLabels={labels} data={data} />
}
```

> Each key in the `data` object must match an `id` attribute in the SVG's `<path>` elements.
> Tooltips will display labels from `customMapLabels` if available.

## Credits

This package uses SVG maps from [`amCharts`](https://www.amcharts.com/)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/noeGnh/map-chart/releases).

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/noeGnh/map-chart/blob/master/LICENSE)

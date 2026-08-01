import {
  AfricaMap,
  GermanyMap,
  MapChart as MapChartLite,
  OceaniaMap,
  WorldMap,
} from '@arkn/react-map-chart-lite'
import { MapChart } from '@arkn/react-map-chart'
import type { MapDataValue } from '@map-chart/core'
import { useMemo } from 'react'

import customMap from './maps/p-bl.svg?raw'

const worldData = {
  US: 13,
  CA: 63,
  GB: 10,
  DE: 95,
  JP: 76,
  CN: 46,
  IN: 98,
  BR: 96,
  AU: 10,
  FR: 47,
}

const africaData = {
  ZA: 58, // South Africa
  NG: 72, // Nigeria
  EG: 93, // Egypt
  KE: 45, // Kenya
  GH: 39, // Ghana
  DZ: 17, // Algeria
  MA: 60, // Morocco
}

const germanyData = {
  'DE-BW': 58,
  'DE-BY': 63,
  'DE-NW': 75,
  'DE-HE': 40,
  'DE-BE': 54,
}

const oceaniaData = {
  AU: { color: 'blue', legendLabel: 'Australia / Capital: Canberra' },
  NZ: { color: '#339601', legendLabel: 'New Zealand / Capital: Wellington' },
  PG: { color: '#D31F3C', legendLabel: 'Papua New Guinea / Capital: Port Moresby' },
}

const customMapData = {
  'blitta-1': 66,
  'blitta-2': 58,
  'blitta-3': 36,
}

const customMapLabels = {
  'blitta-1': 'Blitta 1',
  'blitta-2': 'Blitta 2',
  'blitta-3': 'Blitta 3',
}

function App() {
  const isTouchDevice = useMemo(
    () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    []
  )

  const onMapItemClick = (id: string | null, value: number | MapDataValue | null | undefined) => {
    if (!isTouchDevice) alert(`${id}: ${JSON.stringify(value)}`)
  }

  const onMapItemMouseover = (
    id: string | null,
    value: number | MapDataValue | null | undefined
  ) => {
    console.log(`Mouseover ${id}: ${JSON.stringify(value)}`)
  }

  const onMapItemMouseout = (
    id: string | null,
    value: number | MapDataValue | null | undefined
  ) => {
    console.log(`Mouseout ${id}: ${JSON.stringify(value)}`)
  }

  return (
    <div className="grid-container">
      <div className="cell big">
        <MapChartLite
          data={worldData}
          mapStyles={{ height: '100%' }}
          displayLegendWhenEmpty={false}
          onMapItemClick={onMapItemClick}>
          <WorldMap />
        </MapChartLite>
        <div className="map-label">World (lite)</div>
      </div>
      <div className="cell small">
        <MapChartLite
          baseColor="#339601"
          legendValueSuffix="&nbsp;%"
          legendTextColor="whitesmoke"
          legendBgColor="rgba(0, 0, 255, 0.8)"
          data={africaData}
          mapStyles={{ height: '100%' }}
          displayLegendWhenEmpty={false}
          onMapItemClick={onMapItemClick}>
          <AfricaMap />
        </MapChartLite>
        <div className="map-label">Africa (lite)</div>
      </div>
      <div className="cell small">
        <MapChartLite
          baseColor="#3f51b5"
          legendValueSuffix="&nbsp;%"
          data={germanyData}
          mapStyles={{ height: '100%' }}
          onMapItemClick={onMapItemClick}>
          <GermanyMap />
        </MapChartLite>
        <div className="map-label">Germany subdivisions (lite)</div>
      </div>
      <div className="cell small">
        <MapChartLite
          data={oceaniaData}
          mapStyles={{ height: '100%' }}
          onMapItemClick={onMapItemClick}
          onMapItemMouseover={onMapItemMouseover}
          onMapItemMouseout={onMapItemMouseout}>
          <OceaniaMap />
        </MapChartLite>
        <div className="map-label">Oceania (lite)</div>
      </div>
      <div className="cell small">
        <MapChart
          baseColor="#000000"
          legendValueSuffix="&deg;C"
          legendBgColor="rgba(0,0,0,0.7)"
          legendTextColor="white"
          customMapSvg={customMap}
          customMapLabels={customMapLabels}
          data={customMapData}
          mapStyles={{ height: '100%' }}
          areaNameOnMapSize={16}
          areaNameOnMapBgColor="rgba(0, 0, 255, 0.75)"
          areaNameOnMap="all"
          onMapItemClick={onMapItemClick}
        />
        <div className="map-label">Custom map (full)</div>
      </div>
    </div>
  )
}

export default App

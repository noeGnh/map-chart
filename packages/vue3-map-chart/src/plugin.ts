import type { Options } from '@/types'
import type { App, Component } from 'vue'

import MapChart from './components/MapChart.vue'

const plugin = {
  install(app: App, options?: Options) {
    app.component(options?.name || 'MapChart', MapChart)

    if (options?.maps) {
      Object.keys(options.maps).forEach((mapName: string) => {
        // Not a real component (see Options.maps) — MapChart never mounts it,
        // it only reads it back off the vnode `type` it's registered under.
        if (options.maps && options.maps[mapName])
          app.component(mapName, options.maps[mapName] as unknown as Component)
      })
    }
  },
}

export default plugin

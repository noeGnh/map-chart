import { createApp } from 'vue'
import Vue3MapChart, { GermanyMap, JapanMap } from 'vue3-map-chart-lite'

import App from './App.vue'

if (import.meta.env.PROD) {
  import('../../vue3-map-chart-lite/dist/style.css')
}

createApp(App)
  .use(Vue3MapChart, { maps: { GermanyMap, JapanMap } })
  .mount('#app')

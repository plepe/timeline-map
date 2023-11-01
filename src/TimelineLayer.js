const Twig = require('twig')
const twigGet = require('./twigGet')
import state from './state'

import App from './App'
let app
let layer
let layers = {}

App.addExtension({
  id: 'timelineLayer',
  initFun: (_app, callback) => {
    app = _app
    app.on('state-apply', state => {
      if ('id' in state && (!layer || layer.id !== state.id)) {
        if (layer) {
          layer.hide()
        }

        if (state.id in layers) {
          layer.show()
        } else {
          layer = new TimelineLayer(state.id, app.config.source, app.config.feature)
          layers[state.id] = layer
          layer.load(() => {
            layer.init()
            layer.show()
          })
        }
      }

      if ('date' in state) {
        if (layer) {
          layer.setDate(state.date)
        }
      }
    })

    app.on('state-get', state => {
      if (layer) {
        state.id = layer.id
      }
    })

    app.on('initial-map-view', promises => {
      if (!layer) { return }

      promises.push(new Promise((resolve, reject) => {
        app.once('data-loaded', () => {
          resolve({
            type: 'bounds',
            bounds: layer.layer.getBounds()
          })
        })
      }))
    })

    callback()
  }
})

class TimelineLayer {
  constructor (id, source, config) {
    this.id = id
    this.source = source
    this.config = config
  }

  load (callback) {
    const url = twigGet(this.source.url, { id: this.id })
    fetch(url)
      .then(req => req.json())
      .then(data => {
        this.data = data
        callback(null)
      })
  }

  init () {
    this.min = '99999'
    this.max = '0'
    this.timestamps = {}

    this.styleTemplate = Twig.twig({ data: this.config.styleTemplate ?? '{}' })

    this.data.features.forEach(feature => {
      if (this.config.type === 'start-end-field') {
        const start = twigGet(this.config.startField, { item: feature })
        const end = twigGet(this.config.endField, { item: feature })
        feature.log = [ { start, end } ]
      } else if (this.config.type === 'log-array') {
        feature.log = feature.log(e => {
          return { start: e[0], end: e[1] }
        })
      } else if (this.config.type === 'function') {
        feature.log = JSON.parse(twigGet(this.config.logFunction, { item: feature }))
      }

      feature.log.forEach(({ start, end }) => {
        if (start === '') {
          start = null
        }
        if (end === '') {
          end = null
        }

        if (start !== null && start !== '') {
          if (this.min !== null && (start ?? '0') < this.min) {
            this.min = start
          }
          this.timestamps[start] = true
        }

        if (end !== null && end !== '') {
          if (this.max !== null && (end ?? '99999') > this.max) {
            this.max = end
          }
          this.timestamps[end] = true
        }
      })
    })

    this.max = null
    if (!this.max) {
      this.max = new Date()
    }

    this.layer = L.geoJSON(this.data, {
      style: (feature) => {
        return JSON.parse(this.styleTemplate.render({ item: feature }))
      }
    })

    this.allItems = this.layer.getLayers()

    if (this.config.popupTemplate) {
      this.popupTemplate = Twig.twig({ data: this.config.popupTemplate })
      this.layer.bindPopup(item => {
        return this.popupTemplate.render({ item: item.feature })
      })
    }

    app.emit('data-loaded', this)

    const date = state.get().date
    if (date) {
      this.setDate(date)
    }
  }

  show (map) {
    this.layer.addTo(app.map)
  }

  hide (map) {
    app.map.removeLayer(this.layer)
  }

  setDate (date) {
    if (!this.allItems) {
      return
    }

    this.allItems.forEach((item) => {
      const log = item.feature.log

      const shown = log.filter(e => {
        let shown = false
        if (e.start === null || e.start <= date) {
          shown = true
        }
        if (e.end !== null && e.end !== '') {
          if (e.end <= date) {
          shown = false
        }}
        return shown
      })

      if (shown.length) {
        let style = this.styleTemplate.render({ item: item.feature, logEntry: shown[0] })
        style = JSON.parse(style)

        if (!('interactive' in style)) {
          style.interactive = true
        }
        if (!('opacity' in style)) {
          style.opacity = 1
        }

        item.addTo(this.layer)
        if (item.setStyle)
          item.setStyle(style)
      } else {
        this.layer.removeLayer(item)
      }
    })
  }
}

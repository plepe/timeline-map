import Events from 'events'
import state from './state'

import App from './App'
const Twig = require('twig')
const twigGet = require('./twigGet')

App.addExtension({
  id: 'timelineLayer',
  initFun: (app, callback) => {
    app.on('init', () => {
      new TimelineLayer(app, app.config)
    })
    callback()
  }
})

class TimelineLayer extends Events {
  constructor (app, config) {
    super()
    this.app = app
    this.source = config.source
    this.config = config.feature

    this.app.on('state-apply', state => {
      if ('id' in state) {
        const url = twigGet(this.source.url, { id: state.id })
        if (this.url !== url) {
          this.data = null

          this.hide()
          this.load(url, () => {
            this.init()
            this.show()
          })
        }
      }

      if ('date' in state) {
        this.setDate(state.date)
      }
    })

    this.app.on('state-get', state => {
      state.id = this.id
    })

    this.app.on('initial-map-view', promises => {
      promises.push(new Promise((resolve, reject) => {
        if (this.data) {
          return resolve({
            type: 'bounds',
            bounds: this.layer.getBounds()
          })
        }

        this.once('data-loaded', () => {
          resolve({
            type: 'bounds',
            bounds: this.layer.getBounds()
          })
        })
      }))
    })

    ;['start', 'end'].forEach(p => {
      this.app.on('default-' + p + '-date', promises => {
        promises.push(new Promise((resolve, reject) => {
          const starts = this.allItems
            .map(item => twigGet(this.config[p + 'Field'], { item: item.feature }))
            .filter(v => v)
            .sort()

          if (starts.length) {
            resolve(starts[p === 'end' ? starts.length - 1 : 0])
          } else {
            reject()
          }
        }))
      })
    })
  }

  load (url, callback) {
    this.url = url
    fetch(this.url)
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

    this.emit('data-loaded')
    this.app.emit('data-loaded', this)

    const date = state.get().date
    if (date) {
      this.setDate(date)
    }
  }

  show (map) {
    this.layer.addTo(this.app.map)
  }

  hide (map) {
    if (this.layer) {
      this.app.map.removeLayer(this.layer)
    }
  }

  setDate (date) {
    if (!this.allItems) {
      return
    }

    this.allItems.forEach((item) => {
      const log = item.feature.log

      let shown
      if (date) {
        shown = log.filter(e => {
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
      } else {
        shown = [true]
      }

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

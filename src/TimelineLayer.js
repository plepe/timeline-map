const Twig = require('twig')
const twigGet = require('./twigGet')

module.exports = class TimelineLayer {
  constructor (source, config) {
    this.source = source
    this.config = config
  }

  load (callback) {
    fetch(this.source.url)
      .then(req => req.json())
      .then(data => {
        this.data = data
        this.init()
        callback(null)
      })
  }

  init () {
    this.min = null
    this.max = null
    this.timestamps = {}

    this.styleTemplate = Twig.twig({ data: this.config.styleTemplate ?? '{}' })

    this.data.features.forEach(feature => {
      if (this.config.type === 'start-end-field') {
        const start = twigGet(this.config.startField, feature)
        const end = twigGet(this.config.endField, feature)
        feature.log = [ [ start, end ] ]
      }

      feature.log.forEach(([ start, end ]) => {
        if (start !== null && start !== '') {
          if (this.min === null || start < this.min) {
            this.min = start
          }
          this.timestamps[start] = true
        }

        if (end !== null && start !== '') {
          if (this.max === null || end > this.max) {
            this.max = end
          }
          this.timestamps[end] = true
        }
      })
    })

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
  }

  addTo (map) {
    this.layer.addTo(map)
  }

  removeFrom () {
  }

  setDate (date) {
    this.allItems.forEach((item) => {
      const log = item.feature.log
      let shown = false

      log.forEach(e => {
        if (e[0] === null || e[0] <= date) {
          shown = true
        }
        if (e[1] !== null) {
          if (e[1] <= date) {
          shown = false
        }}
      })

      if (shown) {
        let style = this.styleTemplate.render({ item: item.feature })
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

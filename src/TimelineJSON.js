import Events from 'events'
import wkx from 'wkx'
import twigGet from './twigGet'

module.exports = class TimelineJSON extends Events {
  constructor (app, config) {
    super()
    this.app = app
    this.source = config.source
    this.config = config.feature
    this.reqParameter = this.source.reqParameter ?? []
    this.parameter = {}

    this.app.on('state-apply', state => {
      if (this.reqParameter.filter(k => k in state).length === this.reqParameter.length) {
        this.reqParameter.forEach(k => {
          this.parameter[k] = state[k]
        })

        const url = twigGet(this.source.url, state)
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
      Object.entries(this.parameter).forEach(([k, v]) => {
        state[k] = v
      })
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
    this.layer = L.layerGroup()

    this.allItems = this.data.map(item => {
      const result = { item }

      if (this.config.init) {
        twigGet(this.config.init, { item })
      }

      if (this.config.type === 'start-end-field') {
        const start = twigGet(this.config.startField, { item })
        const end = twigGet(this.config.endField, { item })
        result.log = [{ start, end }]
      } else if (this.config.type === 'array') {
        if (item.kartendaten) {
          result.log = JSON.parse(item.kartendaten).map(e => {
            return { start: e.start, end: e.ende }
          })
        } else {
          result.log = []
        }
      } else if (this.config.type === 'log-array') {
        result.log = feature.log(e => {
          return { start: e[0], end: e[1] }
        })
      } else if (this.config.type === 'function') {
        result.log = JSON.parse(twigGet(this.config.logFunction, { item: feature }))
      }

      result.log.forEach(({ start, end }) => {
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

      if (item.kartendaten) {
        const coords = {
          type: 'FeatureCollection',
          features: JSON.parse(item.kartendaten).map(k => {
            return {
              type: 'Feature',
              geometry: wkx.Geometry.parse(k.koordinaten).toGeoJSON()
            }
          })
        }

        result.feature = L.geoJSON(coords, {
          style: (item) => {
            const style = twigGet(this.config.styleTemplate, { item })
            return JSON.parse(style)
          },
          pointToLayer: (feature, latlng) => {
            const icon = this.getIcon(item)
            if (icon) {
              return L.marker(latlng, { icon })
            } else {
              return L.marker(latlng)
            }
          }
        })

        this.layer.addLayer(result.feature)
      }

      return result
    })

    this.max = null
    if (!this.max) {
      this.max = new Date()
    }

    if (this.config.popupTemplate) {
      this.layer.bindPopup(item => {
        return twigGet(this.config.popupTemplate, { item: item.feature })
      })
    }

    // this.emit('data-loaded')
    // this.app.emit('data-loaded', this)

    const date = this.app.state.current.date
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

    this.allItems.forEach(({ item, log, feature }) => {
      let shown
      if (date && log) {
        shown = log.filter(e => {
          let shown = false
          if (e.start === null || e.start <= date) {
            shown = true
          }
          if (e.end !== null && e.end !== '') {
            if (e.end <= date) {
              shown = false
            }
          }
          return shown
        })
      } else {
        shown = [true]
      }

      if (shown.length) {
        let style = twigGet(this.config.styleTemplate, { item, logEntry: shown[0] })
        style = JSON.parse(style)

        if (!('interactive' in style)) {
          style.interactive = true
        }
        if (!('opacity' in style)) {
          style.opacity = 1
        }

        feature.addTo(this.layer)
        if (feature.setStyle) {
          feature.setStyle(style)
        }
        if (feature.setIcon) {
          feature.setIcon(this.getIcon(item, shown[0]))
        }
      } else {
        this.layer.removeLayer(item)
      }
    })
  }

  getIcon (item, logEntry = null) {
    if (!this.config.markerSymbol) {
      return null
    }

    const div = document.createElement('div')
    const html = twigGet(this.config.markerSymbol, { item, logEntry })
    div.innerHTML = html
    const c = div.firstChild

    const iconOptions = {
      html,
      iconAnchor: [0, 0],
      iconSize: [0, 0],
      signAnchor: [0, 0],
      className: 'overpass-layer-icon'
    }
    iconOptions.iconSize = [c.offsetWidth, c.offsetHeight]
    if (c.hasAttribute('width')) {
      iconOptions.iconSize[0] = parseFloat(c.getAttribute('width'))
    }
    if (c.hasAttribute('height')) {
      iconOptions.iconSize[1] = parseFloat(c.getAttribute('height'))
    }

    iconOptions.iconAnchor = [iconOptions.iconSize[0] / 2, iconOptions.iconSize[1] / 2]
    if (c.hasAttribute('anchorx')) {
      iconOptions.iconAnchor[0] = parseFloat(c.getAttribute('anchorx'))
    }
    if (c.hasAttribute('anchory')) {
      iconOptions.iconAnchor[1] = parseFloat(c.getAttribute('anchory'))
    }

    if (c.hasAttribute('signanchorx')) {
      iconOptions.signAnchor[0] = parseFloat(c.getAttribute('signanchorx'))
    }
    if (c.hasAttribute('signanchory')) {
      iconOptions.signAnchor[1] = parseFloat(c.getAttribute('signanchory'))
    }

    if (this.config.markerSign) {
      const x = iconOptions.iconAnchor[0] + iconOptions.signAnchor[0]
      const y = -iconOptions.iconSize[1] + iconOptions.iconAnchor[1] + iconOptions.signAnchor[1]
      iconOptions.html += '<div class="sign" style="margin-left: ' + x + 'px; margin-top: ' + y + 'px;">' + this.config.markerSign + '</div>'
    }

    return L.divIcon(iconOptions)
  }
}

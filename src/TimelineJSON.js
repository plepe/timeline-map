import Events from 'events'
import wkx from 'wkx'
import twigGet from './twigGet'
import loader from './loader'
import isTrue from './isTrue'

module.exports = class TimelineJSON extends Events {
  constructor (app, config) {
    super()
    this.app = app
    this.config = config

    this.app.on('state-apply', () => {
      const state = this.app.state.current

      const url = twigGet(this.config.source.url, { state })
      const filterId = this.config.source.filterId ? twigGet(this.config.source.filterId, { state }) : null

      if (this.url !== url || this.currentFilterId !== filterId) {
        this.currentFilterId = filterId
        this.data = null

        this.hide()
        this.load(url, () => {
          this.init()
          this.show()
        })
      }

      if ('date' in state) {
        this.setDate(state.date)
      }
    })

    this.app.on('initial-map-view', promises => {
      promises.push(new Promise((resolve, reject) => {
        if (this.data) {
          return resolve({
            type: 'bounds',
            bounds: this.initialMapView()
          })
        }

        this.once('data-loaded', () => {
          resolve({
            type: 'bounds',
            bounds: this.initialMapView()
          })
        })
      }))
    })

    this.app.on('timeline-timespan', promises => {
      promises.push(new Promise((resolve, reject) => {
        if (this.data) {
          return resolve(this.getTimelineTimespan())
        }

        this.once('data-loaded', () => {
          return resolve(this.getTimelineTimespan())
        })
      }))
    })
  }

  load (url, callback) {
    this.url = url
    loader(url, {}, (err, data) => {
      if (this.config.source.filter) {
        this.data = data.filter(item =>
          isTrue(twigGet(this.config.source.filter, { item, state: this.app.state.current }))
        )
      } else {
        this.data = data
      }

      callback(err)
    })
  }

  init () {
    this.min = '99999'
    this.max = '0'
    this.timestamps = {}
    this.layer = L.featureGroup()

    this.allItems = this.data.map(item => {
      const result = { item }

      if (this.config.feature.init) {
        twigGet(this.config.feature.init, { item, state: this.app.state.current })
      }

      if (this.config.feature.type === 'start-end-field') {
        const start = twigGet(this.config.feature.startField, { item, state: this.app.state.current })
        const end = twigGet(this.config.feature.endField, { item, state: this.app.state.current })
        result.log = [{ start, end }]
      } else if (this.config.feature.type === 'log-array') {
        result.log = feature.log(e => {
          return { start: e[0], end: e[1] }
        })
      } else if (this.config.feature.type === 'function') {
        try {
          const l = twigGet(this.config.feature.logFunction, { item, state: this.app.state.current })
          result.log = JSON.parse(l)
        } catch (e) {
          console.error(e.message)
        }
      }

      result.log.forEach(logEntry => {
        let start = this.config.feature.startLog ?
          twigGet(this.config.feature.startLog, { item, logEntry, state: this.app.state.current }) :
          logEntry[this.config.feature.startLogField ?? 'start']
        let end = this.config.feature.endLog ?
          twigGet(this.config.feature.endLog, { item, logEntry, state: this.app.state.current }) :
          logEntry[this.config.feature.endLogField ?? 'end']

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

      if (this.config.feature.geomLogField) {
        result.features = result.log.map(logEntry => {
          if (!logEntry[this.config.feature.geomLogField]) {
            return
          }

          const coords = {
            type: 'Feature',
            properties: { item, logEntry },
            geometry: wkx.Geometry.parse(logEntry[this.config.feature.geomLogField]).toGeoJSON()
          }

          const feature = this.coordsToLeaflet(coords, item, logEntry)
          this.layer.addLayer(feature)
          return feature
        })
      } else if (this.config.feature.geomField) {
        const coords = {
          type: 'Feature',
          properties: { item },
          geometry: wkx.Geometry.parse(item[this.config.feature.geomField]).toGeoJSON()
        }

        result.feature = coordsToLeaflet(coords, item)
      }

      return result
    })

    this.max = null
    if (!this.max) {
      this.max = new Date()
    }

    if (this.config.feature.popupTemplate || this.config.feature.popupSource) {
      this.layer.bindPopup(feature => {
        const div = document.createElement('div')

        if (this.config.feature.popupTemplate) {
          const content = twigGet(this.config.feature.popupTemplate, { ...feature.feature.properties, state: this.app.state.current })
          div.innerHTML = content
        }

        if (this.config.feature.popupSource) {
          const url = twigGet(this.config.feature.popupSource.url, { ...feature.feature.properties, state: this.app.state.current })
          fetch(url)
            .then(req => req.text())
            .then(body => {
              if (this.config.feature.popupSource.querySelector) {
                const x = document.createElement('div')
                x.innerHTML = body

                const content = x.querySelector(this.config.feature.popupSource.querySelector)
                if (content) {
                  body = content.innerHTML
                }
              }

              div.innerHTML = body
            })
        }

        return div
      })
    }


    this.emit('data-loaded')
    this.app.emit('data-loaded', this)

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

    this.allItems.forEach(({ item, log, feature, features }, i) => {
      let shown
      if (date && log) {
        shown = log.map(e => {
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
        shown = log ? log.map(v => true) : [true]
      }

      if (shown.includes(true)) {
        let style = twigGet(this.config.feature.styleTemplate, { item, logEntry: shown[0], state: this.app.state.current })
        try {
          style = JSON.parse(style)
        } catch (e) {
          console.error(e.message)
        }

        if (!('interactive' in style)) {
          style.interactive = true
        }
        if (!('opacity' in style)) {
          style.opacity = 1
        }

        if (features) {
          features.forEach((f, i) => {
            if (!f) { return }

            if (shown[i]) {
              if (f.setStyle) {
                f.setStyle(style)
              }
              if (f.setIcon) {
                f.setIcon(this.getIcon(item, log[i]))
              }

              f.addTo(this.layer)
            } else if (this.layer.hasLayer(f)) {
              this.layer.removeLayer(f)
            }
          })
        } else if (feature) {
          if (feature.setStyle) {
            feature.setStyle(style)
          }
          if (feature.setIcon) {
            feature.setIcon(this.getIcon(item, shown[0]))
          }

          feature.addTo(this.layer)
        }
      } else {
        if (features) {
          features.forEach(f => {
            if (this.layer.hasLayer(f)) {
              this.layer.removeLayer(f)
            }
          })
        } else if (this.layer.hasLayer(features)) {
          this.layer.removeLayer(feature)
        }
      }
    })
  }

  getIcon (item, logEntry = null) {
    if (!this.config.feature.markerSymbol) {
      return null
    }

    const div = document.createElement('div')
    const html = twigGet(this.config.feature.markerSymbol, { item, logEntry, state: this.app.state.current })
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

    if (this.config.feature.markerSign) {
      const x = iconOptions.iconAnchor[0] + iconOptions.signAnchor[0]
      const y = -iconOptions.iconSize[1] + iconOptions.iconAnchor[1] + iconOptions.signAnchor[1]
      iconOptions.html += '<div class="sign" style="margin-left: ' + x + 'px; margin-top: ' + y + 'px;">' + twigGet(this.config.feature.markerSign, { item, logEntry, state: this.app.state.current }) + '</div>'
    }

    return L.divIcon(iconOptions)
  }

  coordsToLeaflet (coords, item, logEntry = null) {
    if (coords.geometry.type === 'GeometryCollection') {
      const layers = coords.geometry.geometries.map(g => {
        return this.coordsToLeaflet({
          type: 'Feature',
          properties: coords.properties,
          geometry: g
        }, item, logEntry)
      })

      return L.featureGroup(layers)
    }

    return L.geoJSON(coords, {
      style: (feature) => {
        let style
        try {
          style = twigGet(this.config.feature.styleTemplate, { ...feature.properties, state: this.app.state.current })
          style = JSON.parse(style)
        } catch (e) {
          console.error(e.message)
        }

        return style
      },
      pointToLayer: (feature, latlng) => {
        const icon = this.getIcon(item, logEntry)
        if (icon) {
          return L.marker(latlng, { icon })
        } else {
          return L.marker(latlng)
        }
      }
    })
  }

  initialMapView () {
    let allItems = this.allItems
    let group = []

    if (this.config.feature.initialMapView) {
      allItems = allItems.forEach(({ item, log, feature, features }) => {
        if (!isTrue(twigGet(this.config.feature.initialMapView, { item, state: this.app.state.current }))) {
          return
        }

        if (feature) {
          group.push(feature)
        } else if (features) {
          group = group.concat(features)
        }
      })

      group = group.filter(f => f)

      const layer = L.featureGroup(group)
      return layer.getBounds()
    } else {
      return this.layer.getBounds()
    }
  }

  getTimelineTimespan () {
    const ranges = this.allItems
      .map(({ item }) => {
        const p = { item, state: this.app.state.current }

        if (!isTrue(twigGet(this.config.feature.considerTimelineTimespan, p))) {
          return
        }

        return {
          start: twigGet(this.config.feature.startField, p),
          end: twigGet(this.config.feature.endField, p)
        }
      })
      .filter(v => v)

    const starts = ranges.map(v => v.start).filter(v => v).sort()
    const ends = ranges.map(v => v.end).filter(v => v).sort().reverse()

    return {
      start: starts.length ? starts[0] : null,
      end: ends.length ? ends[0] : null
    }
  }
}

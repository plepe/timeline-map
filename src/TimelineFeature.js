/* global L:false */
import wkx from 'wkx'
import twigGet from './twigGet'
import completeDate from './completeDate'
import isTrue from './isTrue'
import ContentDisplay from './ContentDisplay'

module.exports = class TimelineFeature {
  constructor (layer, item, index) {
    this.layer = layer
    this.app = layer.app
    this.config = layer.config
    this.item = item
    this.index = index
  }

  init () {
    this.twigContext = { item: this.item, state: this.app.state.current }

    if (this.config.feature.init) {
      twigGet(this.config.feature.init, this.twigContext)
    }
  }

  twigData () {
    this.twigContext.state = this.app.state.current
    return this.twigContext
  }

  prepare () {
    this.twigContext.state = this.app.state.current

    if (this.config.feature.type === 'start-end-field') {
      const start = twigGet(this.config.feature.startField, this.twigContext)
      const end = twigGet(this.config.feature.endField, this.twigContext)
      this.log = [{ start, end }]
    } else if (this.config.feature.type === 'log-array') {
      this.log = this.feature.log(e => {
        return { start: e[0], end: e[1] }
      })
    } else if (this.config.feature.type === 'function') {
      try {
        const l = twigGet(this.config.feature.logFunction, this.twigContext)
        this.log = JSON.parse(l)
      } catch (e) {
        console.error(e.message)
      }
    }

    this.twigContext.log = this.log

    this.log.forEach(logEntry => {
      this.logGetStartEnd(logEntry)
    })

    this.log.forEach((logEntry, i) => {
      if (i > 0 && !logEntry._start) {
        logEntry._start = this.log[i - 1]._end
      }
      if (i < this.log.length - 1 && !logEntry._end) {
        logEntry._end = this.log[i + 1]._start
      }
    })

    this.log.forEach(logEntry => {
      this.twigContext.logEntry = logEntry

      if (logEntry._start !== null) {
        if (this.min !== null && (logEntry._start ?? '0') < this.min) {
          this.min = logEntry._start
        }
        this.layer.timestamps[logEntry._start] = true
      }

      if (logEntry._end !== null && logEntry._end !== '') {
        if (this.max !== null && (logEntry._end ?? '99999') > this.max) {
          this.max = logEntry._end
        }
        this.layer.timestamps[logEntry._end] = true
      }
    })

    if (this.config.feature.geomLogField) {
      this.features = this.log.map(logEntry => {
        if (!logEntry[this.config.feature.geomLogField]) {
          return null
        }

        const coords = {
          type: 'Feature',
          properties: this,
          geometry: this.parseGeom(logEntry[this.config.feature.geomLogField])
        }

        return this.coordsToLeaflet(coords)
      })
    } else if (this.config.feature.geomField) {
      const coords = {
        type: 'Feature',
        properties: this,
        geometry: this.parseGeom(this.item[this.config.feature.geomField])
      }

      this.feature = this.coordsToLeaflet(coords)
    }
  }

  logGetStartEnd (logEntry) {
    this.twigContext.state = this.app.state.current
    this.twigContext.logEntry = logEntry

    let start = this.config.feature.startLog
      ? twigGet(this.config.feature.startLog, this.twigContext)
      : logEntry[this.config.feature.startLogField ?? 'start']
    let end = this.config.feature.endLog
      ? twigGet(this.config.feature.endLog, this.twigContext)
      : logEntry[this.config.feature.endLogField ?? 'end']
    start = completeDate(start, 'start')
    end = completeDate(end, 'end')

    if (start === '') {
      start = null
    }
    if (end === '') {
      end = null
    }

    logEntry._start = start
    logEntry._end = end
  }

  setDate (date) {
    this.twigContext.state = this.app.state.current

    let shown
    if (date && this.log) {
      shown = this.log.map(logEntry => {
        let shown = false
        if (logEntry._start === null || logEntry._start <= date) {
          shown = true
        }
        if (logEntry._end !== null && logEntry._end !== '') {
          if (logEntry._end <= date) {
            shown = false
          }
        }
        return shown
      })
    } else {
      shown = this.log ? this.log.map(v => true) : [true]
    }

    if (shown.includes(true)) {
      const shownIndex = shown
        .map((l, i) => l ? i : null)
        .filter(i => i !== null)
      const logEntry = this.log[shownIndex[0]]
      this.logEntry = logEntry
      this.twigContext.logEntry = logEntry

      let style = twigGet(this.config.feature.styleTemplate, this.twigContext)

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

      if (this.features) {
        this.features.forEach((f, i) => {
          this.twigContext.logEntry = this.log[i]

          if (!f) { return }

          if (shown[i]) {
            if (f.setStyle) {
              f.setStyle(style)
            }
            if (f.setIcon) {
              f.setIcon(this.getIcon())
            }

            f.addTo(this.layer.layer)
          } else if (this.layer.layer.hasLayer(f)) {
            this.layer.layer.removeLayer(f)
          }
        })
      } else if (this.feature) {
        if (this.feature.setStyle) {
          this.feature.setStyle(style)
        }
        if (this.feature.setIcon) {
          this.feature.setIcon(this.getIcon(shown[0]))
        }

        this.feature.addTo(this.layer.layer)
      }
    } else {
      this.logEntry = null

      if (this.features) {
        this.features.forEach(f => {
          if (!f) { return }
          if (this.layer.layer.hasLayer(f)) {
            this.layer.layer.removeLayer(f)
          }
        })
      } else if (this.layer.layer.hasLayer(this.feature)) {
        this.layer.layer.removeLayer(this.feature)
      }
    }
  }

  showPopup () {
    const popup = new ContentDisplay({
      template: this.config.feature.popupTemplate,
      source: this.config.feature.popupSource,
      update: this.config.feature.popupModifyApply
    })

    this.twigContext.state = this.app.state.current
    popup.show(this.twigContext)

    popup.on('ready', () => this.app.emit('popup-open', popup.content))

    return popup
  }

  getIcon () {
    if (!this.config.feature.markerSymbol) {
      return null
    }

    const div = document.createElement('div')
    const html = twigGet(this.config.feature.markerSymbol, this.twigContext)
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
      iconOptions.html += '<div class="sign" style="margin-left: ' + x + 'px; margin-top: ' + y + 'px;">' + twigGet(this.config.feature.markerSign, this.twigContext) + '</div>'
    }

    return L.divIcon(iconOptions)
  }

  coordsToLeaflet (coords) {
    if (coords.geometry.type === 'GeometryCollection') {
      const layers = coords.geometry.geometries.map(g => {
        return this.coordsToLeaflet({
          type: 'Feature',
          properties: coords.properties,
          geometry: g
        })
      })

      return L.featureGroup(layers)
    } else if (coords.geometry.type === 'MultiPoint') {
      const layers = coords.geometry.coordinates.map(g => {
        return this.coordsToLeaflet({
          type: 'Feature',
          properties: coords.properties,
          geometry: {
            type: 'Point',
            coordinates: g
          }
        })
      })

      return L.featureGroup(layers)
    }

    return L.geoJSON(coords, {
      style: (feature) => {
        let style
        try {
          style = twigGet(this.config.feature.styleTemplate, this.twigContext)
          style = JSON.parse(style)
        } catch (e) {
          console.error(e.message)
        }

        return style
      },
      pointToLayer: (feature, latlng) => {
        let markerOptions
        try {
          markerOptions = twigGet(this.config.feature.markerOptions ?? '{}', this.twigContext)
          markerOptions = JSON.parse(markerOptions)
        } catch (e) {
          console.error(e.message)
        }

        const icon = this.getIcon()
        if (icon) {
          return L.marker(latlng, { ...markerOptions, icon })
        } else {
          return L.marker(latlng, markerOptions)
        }
      }
    })
  }

  parseGeom (value) {
    switch (this.config.feature.geomType) {
      case 'geojson':
        return value
      case 'wkt':
      case 'ewkt':
      case 'wkb':
      case 'ewkb':
      case 'twkb':
      default:
        return wkx.Geometry.parse(value).toGeoJSON()
    }
  }

  initialMapView () {
    this.twigContext.state = this.app.state.current

    return isTrue(twigGet(this.config.feature.initialMapView, this.twigContext))
  }

  leafletFeatures () {
    if (this.feature) {
      return [this.feature]
    } else {
      return this.features.filter(f => f)
    }
  }

  getTimelineTimespan () {
    this.twigContext.state = this.app.state.current

    if (!isTrue(twigGet(this.config.feature.considerTimelineTimespan, this.twigContext))) {
      return null
    }

    const result = {
      start: twigGet(this.config.feature.startField, this.twigContext),
      end: twigGet(this.config.feature.endField, this.twigContext)
    }

    return result
  }

  getTimelineItems () {
    const config = this.config.feature.timeline
    this.twigContext.state = this.app.state.current

    const data = Object.fromEntries(Object.entries(config).map(([k, v]) => {
      if (typeof v === 'string') {
        v = twigGet(v, this.twigContext)
      }
      return [k, v]
    }))

    if ('show' in data && !isTrue(data.show)) {
      return null
    }

    if (!('start' in data)) {
      data.start = twigGet(this.config.feature.startField, this.twigContext)
    }

    if (!('end' in data)) {
      data.end = twigGet(this.config.feature.endField, this.twigContext)
    }

    data.start = completeDate(data.start, 'start')
    data.end = completeDate(data.end, 'end')

    if (data.start) {
      return data
    }
  }
}

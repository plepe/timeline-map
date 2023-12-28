/* global L:false */
import Events from 'events'
import twigGet from './twigGet'
import loader from './loader'
import isTrue from './isTrue'
import TimelineFeature from './TimelineFeature'

let currentPopupDisplay, currentPopupItem

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

      this.setDate(state.date)

      if (currentPopupDisplay) {
        currentPopupDisplay.update(currentPopupItem.twigData())
      }
    })

    this.app.on('timeline-get-items', promises =>
      promises.push(new Promise((resolve) => {
        if (this.data) {
          return resolve(this.getTimelineItems())
        }

        this.once('data-loaded', () => {
          resolve(this.getTimelineItems())
        })
      }))
    )

    this.app.on('initial-map-view', promises => {
      promises.push(new Promise((resolve, reject) => {
        if (this.data) {
          return resolve({
            bounds: this.initialMapView()
          })
        }

        this.once('data-loaded', () => {
          resolve({
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

    this.app.on('refresh', () => this.init())
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

    this.allItems = this.data.map((item, index) => new TimelineFeature(this, item, index))
    this.allItems.forEach(f => f.init())
    console.log('init')
    this.allItems.forEach(f => f.prepare())
    console.log('prepare')

    this.max = null
    if (!this.max) {
      this.max = new Date()
    }

    if (this.config.feature.popupTemplate || this.config.feature.popupSource) {
      this.layer.bindPopup(feature => {
        currentPopupItem = feature.feature.properties
        currentPopupDisplay = feature.feature.properties.showPopup()
        return currentPopupDisplay.content
      })
    }

    this.emit('data-loaded')
    this.app.emit('data-loaded', this)

    this.setDate(this.app.state.current.date)
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

    this.allItems.forEach(f => f.setDate(date))
  }

  initialMapView () {
    let group = []

    if (this.config.feature.initialMapView) {
      this.allItems.forEach(feature => {
        if (!feature.initialMapView()) {
          return
        }

        group = group.concat(feature.leafletFeatures())
      })

      const layer = L.featureGroup(group)
      return layer.getBounds()
    } else {
      return this.layer.getBounds()
    }
  }

  getTimelineTimespan () {
    const ranges = this.allItems
      .map(feature => {
        const result = feature.getTimelineTimespan()

        return result && result.start ? result : null
      })
      .filter(v => v)

    const starts = ranges.map(v => v.start).filter(v => v).sort()
    const ends = ranges.map(v => v.end).filter(v => v).sort().reverse()

    return {
      start: starts.length ? starts[0] : null,
      end: ends.length ? ends[0] : null
    }
  }

  getTimelineItems () {
    if (!this.config.feature.timeline) {
      return []
    }

    const items = this.allItems
      .map(feature => feature.getTimelineItems())
      .filter(v => v)

    return items
  }
}

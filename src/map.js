/* global L:false */
import App from './App'
App.addExtension({
  id: 'map',
  requireExtensions: ['config'],
  initFun
})

function initFun (app, callback) {
  app.map = L.map('map', { maxZoom: app.config.maxZoom })

  // Show OSM map background
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxNativeZoom: 19,
    maxZoom: app.config.maxZoom,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(app.map)

  app.map.attributionControl.setPrefix('<a target="_blank" href="https://github.com/geowiki-net/geowiki-viewer/">geowiki-viewer</a>')

  app.map.on('moveend', (e) => {
    if (app.interactive) {
      app.updateLink()
    } else {
      console.log('skip')
    }
  })

  app.on('state-apply', state => {
    if (state.lat && state.lon && state.zoom) {
      app.setNonInteractive(true)
      if (typeof app.map.getZoom() === 'undefined') {
        app.map.setView({ lat: state.lat, lng: state.lon }, state.zoom)
      } else {
        app.map.flyTo({ lat: state.lat, lng: state.lon }, state.zoom)
      }
      app.setNonInteractive(false)
    }

    if (app.map.getZoom()) {
      return
    }

    const promises = []
    app.emit('initial-map-view', promises)
    Promise.any(promises)
      .then(value => {
        app.setNonInteractive(true)
        switch (value.type) {
          case 'bounds':
            app.map.fitBounds(value.bounds)
            break
          case 'view':
            app.map.setView(value.center, value.zoom)
            break
        }
        app.setNonInteractive(false)
      })
      .catch(err => {
        app.setNonInteractive(true)
        app.map.setView([0, 0], 4)
        app.setNonInteractive(false)
      })
  })

  app.on('state-get', state => {
    if (typeof app.map.getZoom() !== 'undefined') {
      const center = app.map.getCenter().wrap()
      const zoom = parseInt(app.map.getZoom())

      state.lat = center.lat
      state.lon = center.lng
      state.zoom = zoom
    }
  })

  callback()
}

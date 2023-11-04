import App from 'geowiki-viewer/src/App'
const OverpassFrontend = require('overpass-frontend')
const LeafletGeowiki = require('leaflet-geowiki')

const overpassFrontendData = {}

App.addExtension({
  id: 'overlays',
  requireExtensions: ['map'],
  initFun: (app, callback) => {
    if (app.config.overlays) {
      app.config.overlays.forEach(l => {
        if (l.data && !(l.data in overpassFrontendData)) {
          overpassFrontendData[l.data] = new OverpassFrontend(l.data)
        }

        const layer = new LeafletGeowiki({
          overpassFrontend: overpassFrontendData[l.data],
          styleFile: l.styleFile
        })

        layer.addTo(app.map)
      })
    }

    callback()
  }
})

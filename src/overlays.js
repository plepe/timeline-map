const OverpassFrontend = require('overpass-frontend')
const LeafletGeowiki = require('leaflet-geowiki/minimal')
import App from 'geowiki-viewer/src/App'
const twigGet = require('./twigGet')

const overpassFrontendData = {}

module.exports = {
  id: 'overlays',
  requireModules: ['map'],
  appInit: (app, callback) => {
    if (app.config.overlays) {
      app.config.overlays.forEach(l => {
        if (l.data && !(l.data in overpassFrontendData)) {
          overpassFrontendData[l.data] = new OverpassFrontend(l.data)
        }

        LeafletGeowiki.modules = [...LeafletGeowiki.modules, ...App.modules]

        const layer = new LeafletGeowiki({
          overpassFrontend: overpassFrontendData[l.data],
          styleFile: l.styleFile
        })

        if (l.filter) {
          layer.setFilter(twigGet(l.filter, { state: app.state.current }))
          app.on('state-apply', state => {
            layer.setFilter(twigGet(l.filter, { state: app.state.current }))
          })
        }

        layer.addTo(app.map)
      })
    }

    callback()
  }
}

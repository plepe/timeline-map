/* global L:false */
import modulekitLang from 'modulekit-lang'

let app

module.exports = {
  id: 'focusData',
  appInit: (_app, callback) => {
    app = _app
    app.on('init', () => {
      app.map.addControl(new FocusDataControl())
    })
    callback()
  }
}

const FocusDataControl = L.Control.extend({
  options: {
    position: 'topleft'
    // control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
  },
  onAdd: function (map) {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control-fullscreen')
    container.innerHTML = "<a href='#'><i class='fa fa-arrows-to-circle'></i></a>"
    container.title = modulekitLang.lang('focus-to-data')

    container.onclick = function () {
      app.getParameter('initial-map-view')
        .then(value => {
          if (value.bounds) {
            app.map.flyToBounds(value.bounds, value.options ?? {})
          } else if (value.center) {
            app.map.flyTo(value.center, value.zoom ?? (value.options ?? {}).maxZoom ?? 12, value.options ?? {})
          }
        })

      return false
    }

    return container
  }
})

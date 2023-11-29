import App from 'geowiki-viewer/src/App'
import modulekitLang from 'modulekit-lang'

let app

App.addExtension({
  id: 'focusData',
  initFun: (_app, callback) => {
    app = _app
    app.on('init', () => {
      app.map.addControl(new FocusDataControl())
    })
    callback()
  }
})

var FocusDataControl = L.Control.extend({
  options: {
    position: 'topleft'
    // control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
  },
  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control-fullscreen')
    container.innerHTML = "<a href='#'><i class='fa fa-arrows-to-circle'></i></a>"
    container.title = modulekitLang.lang('focus-to-data')

    container.onclick = function () {
      app.getParameter('initial-map-view')
        .then(value => {
          if (value.bounds) {
            app.map.flyToBounds(value.bounds)
          }
          else if (value.center) {
            app.map.flyTo(value.center)
          }
        })

      return false
    }

    return container
  }
})

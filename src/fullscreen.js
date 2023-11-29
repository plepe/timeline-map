import App from 'geowiki-viewer/src/App'
import modulekitLang from 'modulekit-lang'

App.addExtension({
  id: 'fullscreen',
  initFun: (app, callback) => {
    app.on('init', () => {
      app.map.addControl(new FullscreenControl())
    })
    callback()
  }
})

var FullscreenControl = L.Control.extend({
  options: {
    position: 'topleft'
    // control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
  },
  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control-fullscreen')
    container.innerHTML = "<a href='#'><i class='fa fa-arrows-alt'></i></a>"
    container.title = modulekitLang.lang('toggle_fullscreen')

    container.onclick = function () {
      document.body.classList.toggle('fullscreen')
      app.map.invalidateSize()
      return false
    }

    return container
  }
})

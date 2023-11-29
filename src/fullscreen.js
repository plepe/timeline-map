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
    container.innerHTML = "<a href='#'><i class='fa fa-expand'></i></a>"
    container.title = modulekitLang.lang('toggle_fullscreen')

    container.onclick = function () {
      const dom = document.body

      if (dom.requestFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          dom.requestFullscreen()
          document.body.classList.add('fullscreen')
        }
      } else {
        document.body.classList.toggle('fullscreen')
      }

      app.map.invalidateSize()
      return false
    }

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen')
        app.map.invalidateSize()
      }
    })

    return container
  }
})

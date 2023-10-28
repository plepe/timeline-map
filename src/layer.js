import yaml from 'js-yaml'

import App from './App'
App.addExtension({
  id: 'layer',
  requireExtensions: ['map', 'lang'],
  initFun
})
let app
let timeout = null

function initFun (_app, callback) {
  app = _app

  app.on('state-apply', state => {
    if (!app.layer || ('styleFile' in state && state.styleFile !== app.options.styleFile)) {
      changeLayer(state.styleFile)
    }
  })

  app.on('state-get', state => {
    state.styleFile = app.options.styleFile
  })

  app.on('lang-change', () => {
    changeLayer(app.options.styleFile, { force: true })
  })

  app.on('data-defined', () => {
    changeLayer(app.options.styleFile, { force: true })
  })

  callback()
}

function changeLayer (styleFile, options = {}) {
  if (timeout) {
    global.clearTimeout(timeout)
  }

  timeout = global.setTimeout(() => _changeLayer(styleFile, options), 0)
}

function _changeLayer (styleFile, options = {}) {
  if (app.layer) {
    app.setNonInteractive(true)
    app.layer.remove()
    app.layer = null
    app.setNonInteractive(false)
  }

  app.options.styleFile = styleFile

  if (!styleFile) {
    return
  }

  styleLoader.get(styleFile)
    .then(style => {
      app.emit('style-load', style)

      style = yaml.load(style)

      // a layer has been added in the meantime
      if (app.layer) {
        app.setNonInteractive(true)
        app.layer.remove()
        app.layer = null
        app.setNonInteractive(false)
      }

      app.layer = new LeafletGeowiki({
        overpassFrontend: app.overpassFrontend,
        style: style
      })

      app.setNonInteractive(true)
      if (app.map) {
        app.layer.addTo(app.map)
      }
      app.setNonInteractive(false)

      app.layer.on('load', () => app.emit('layer-load', app.layer))

      app.layer.on('error', error => global.alert(error))
    })
    .catch(error => {
      if (!error.errors) {
        global.alert(error.message)
      } else if (error.errors.length) {
        global.alert(error.errors[0].message)
      } else {
        global.alert("Style file not found")
      }
    })
}

import App from 'geowiki-viewer/src/App'

let resizeRequest

App.addExtension({
  id: 'resize',
  initFun: (app, callback) => {
    app.resize = () => {
      if (resizeRequest) { return }

      resizeRequest = global.setTimeout(() => {
        resizeRequest = null
        app.map.invalidateSize()
        app.emit('resize')
      })
    }

    callback()
  }
})

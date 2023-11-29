import App from 'geowiki-viewer/src/App'

let refreshRequest

App.addExtension({
  id: 'refresh',
  initFun: (app, callback) => {
    app.refresh = () => {
      if (refreshRequest) { return }

      refreshRequest = global.setTimeout(() => {
        refreshRequest = null
        app.emit('refresh')
      })
    }

    callback()
  }
})

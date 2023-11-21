import App from 'geowiki-viewer/src/App'

App.addExtension({
  id: 'addParam',
  initFun: (app, callback) => {
    app.on('state-get', state => {
      (app.config.addParam ?? []).forEach(k => {
        state[k] = app.state.current[k]
      })
    })

    callback()
  }
})

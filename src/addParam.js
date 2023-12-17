import App from 'geowiki-viewer/src/App'

App.addExtension({
  id: 'addParam',
  initFun: (app, callback) => {
    app.on('state-get', state => {
      (app.config.addParam ?? []).forEach(k => {
        if (typeof k === 'object') {
          const key = Object.keys(k)[0]
          state[key] = app.state.current[key]
        } else {
          state[k] = app.state.current[k]
        }
      })
    })

    callback()
  }
})

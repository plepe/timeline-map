import App from 'geowiki-viewer/src/App'

App.addExtension({
  id: 'addParam',
  initFun: (app, callback) => {
    const paramList = app.config.addParam ?? []

    app.on('state-get', state => {
      Object.forEach(paramList).forEach(k => {
        state[k] = app.state.current[k]
      })
    })

    callback()
  }
})

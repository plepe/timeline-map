import App from 'geowiki-viewer/src/App'

App.addExtension({
  id: 'addParam',
  initFun: (app, callback) => {
    const paramList = app.config.addParam ?? []
    const parameter = {}

    app.on('state-apply', () => {
      const state = app.state.current

      paramList.forEach(k => {
        parameter[k] = state[k]
      })
    })

    app.on('state-get', state => {
      Object.entries(parameter).forEach(([k, v]) => {
        state[k] = v
      })
    })

    callback()
  }
})

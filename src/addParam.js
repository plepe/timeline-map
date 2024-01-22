module.exports = {
  id: 'addParam',
  appInit: (app, callback) => {
    app.on('state-get', state => {
      (app.config.addParam ?? []).forEach(k => {
        if (typeof k === 'object') {
          const key = Object.keys(k)[0]
          const options = Object.values(k)[0]

          let value = app.state.current[key]

          if (value === null && options.includeNull) {
            value = ''
          }

          state[key] = value
        } else {
          state[k] = app.state.current[k]
        }
      })
    })

    callback()
  }
}

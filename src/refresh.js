let refreshRequest

module.exports = {
  id: 'refresh',
  appInit: (app, callback) => {
    app.refresh = () => {
      if (refreshRequest) { return }

      refreshRequest = global.setTimeout(() => {
        refreshRequest = null
        app.emit('refresh')
      })
    }

    callback()
  }
}

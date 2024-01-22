let resizeRequest

module.exports = {
  id: 'resize',
  appInit: (app, callback) => {
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
}

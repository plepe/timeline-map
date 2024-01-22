const types = {
  TimelineGeoJSON: require('./TimelineGeoJSON'),
  TimelineJSON: require('./TimelineJSON')
}

module.exports = {
  id: 'layers',
  appInit: (app, callback) => {
    app.on('init', () => {
      const layers = app.config.layers ?? [app.config]
      app.timelineLayers = layers.map(l => {
        const Type = types[l.type ?? 'TimelineGeoJSON']
        return new Type(app, l)
      })
    })

    callback()
  }
}

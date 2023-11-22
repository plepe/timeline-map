import App from 'geowiki-viewer/src/App'

const types = {
  TimelineGeoJSON: require('./TimelineGeoJSON'),
  TimelineJSON: require('./TimelineJSON')
}

App.addExtension({
  id: 'layers',
  initFun: (app, callback) => {

    app.on('init', () => {
      const layers = app.config.layers ?? [ app.config ]
      layers.forEach(l => {
        const Type = types[l.type ?? 'TimelineGeoJSON']
        new Type(app, l)
      })
    })

    callback()
  }
})

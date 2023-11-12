import App from 'geowiki-viewer/src/App'

const visTimeline = require('vis-timeline')
const visDataset = require('vis-data')
const moment = require('moment')
let app
let date = null

const types = {
  TimelineGeoJSON: require('./TimelineGeoJSON'),
  TimelineJSON: require('./TimelineJSON'),
  TimelineTimestamps: require('./TimelineTimestamps')
}

App.addExtension({
  id: 'timeline',
  initFun: (_app, callback) => {
    app = _app
    init()

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

function init () {
  const options = {
    autoResize: true
  }

  const container = document.getElementById('timeline')
  const items = new visDataset.DataSet([])
  const timeline = new visTimeline.Timeline(container, items, options)
  timeline.addCustomTime()
  timeline.on('timechanged', (e) => {
    date = moment(e.time).format()
    app.updateLink()
    app.state.apply({ date })
  })
  timeline.on('click', (e) => {
    date = moment(e.time).format()
    app.updateLink()
    app.state.apply({ date })
  })
  app.on('state-get', state => {
    state.date = date
  })
  app.on('timeline-dataset', items => {
    timeline.setItems(new visDataset.DataSet(items))
  })

/*
  const timestamps = Object.keys(layer.timestamps).map(t => {
    return { date: t, name: 'Ereignis' }
  })

  const items = new visDataset.DataSet(timestamps.map(entry => {
    return {
      content: entry.date.substr(0, 10),
      start: entry.date
    }
  }))

  //timeline.setItems(items)
  */

  app.on('data-loaded', layer => {
    timeline.setCustomTimeMarker('Zeitpunkt')
    timeline.setOptions({
      min: layer.min,
      max: layer.max,
      snap: null,
      cluster: {
        titleTemplate: '{count} Zeitpunkte'
      }
    })

    timeline.setWindow(layer.min, layer.max)
  })

  app.on('state-apply', state => {
    if ('date' in state) {
      date = state.date
      timeline.setCustomTime(state.date)
    }
  })
}

function setDate (date) {
  app.state.apply({ date })
}

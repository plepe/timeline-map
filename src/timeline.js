import App from 'geowiki-viewer/src/App'

const visTimeline = require('vis-timeline')
const visDataset = require('vis-data')
const moment = require('moment')
let app
let date = null

App.addExtension({
  id: 'timeline',
  initFun: (_app, callback) => {
    app = _app
    init()

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
      timeline.setCustomTime(state.date ?? '')
    }

    if ('id' in state) {
      app.getParameter('timeline-timespan', 'all')
        .then(values => {
          const start = values.map(v => v.start).filter(v => v).sort()
          const end = values.map(v => v.end).filter(v => v).sort().reverse()

          timeline.setOptions({
            min: start.length ? start[0] : null,
            max: end.length ? end[0] : null
          })
        })
    }
  })
}

function setDate (date) {
  app.state.apply({ date })
}

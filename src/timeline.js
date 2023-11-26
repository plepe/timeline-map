import App from 'geowiki-viewer/src/App'
import async from 'async'

const visTimeline = require('vis-timeline')
const visDataset = require('vis-data')
const moment = require('moment')
const getTimespan = require('./getTimespan')
let app
let date = null

App.addExtension({
  id: 'timeline',
  initFun: (_app, callback) => {
    app = _app
    app.on('init', init)

    callback()
  }
})

function init () {
  const options = {
    autoResize: true,
    ...(app.config.timeline ? app.config.timeline.options ?? {} : {})
  }

  const container = document.getElementById('timeline')
  const items = new visDataset.DataSet([])
  const timeline = new visTimeline.Timeline(container, items, options)
  timeline.addCustomTime()
  timeline.setCustomTimeMarker('Zeitpunkt')
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

  app.on('state-apply', state => {
    if ('date' in state) {
      date = state.date
      timeline.setCustomTime(state.date ?? '')
    }

    if ('id' in state) {
      getTimespan(app)
        .then(({ start, end }) => {
          console.log(start, end)
          timeline.setWindow(start, end)
        })
    }

    const promises = []
    let items = []
    app.emit('timeline-get-items', promises)
    async.each(promises, (promise, done) => {
      promise.then(_items => {
        items = items.concat(_items)
        done()
      })
    }, () => {
      console.log(items)
      timeline.setItems(new visDataset.DataSet(items))
    })
  })
}

function setDate (date) {
  app.state.apply({ date })
}

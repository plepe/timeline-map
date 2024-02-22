import async from 'async'

const visTimeline = require('vis-timeline')
const visDataset = require('vis-data')
const moment = require('moment')
const getTimespan = require('./getTimespan')
const completeDate = require('./completeDate')
let app
let dataset
let date = null

const urlPrecisionFormats = {
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DDTHH:mm:ss'
}

module.exports = {
  id: 'timeline',
  requireModules: [ 'config' ],
  appInit: (_app, callback) => {
    app = _app
    app.on('init', init)

    app.state.parameters.date = {
      parse (v) {
        if (v === 'now') {
          return new Date().toISOString()
        }
      }
    }

    callback()
  }
}

let customTime

function init () {
  const urlPrecision = app.config.timeline ? app.config.timeline.urlPrecision ?? 'datetime' : 'datetime'
  const options = {
    autoResize: true,
    selectable: true,
    ...(app.config.timeline ? app.config.timeline.options ?? {} : {})
  }

  const container = document.getElementById('timeline')
  dataset = new visDataset.DataSet([])
  const timeline = new visTimeline.Timeline(container, dataset, options)

  if (app.config.timeline && (app.config.timeline.defaultMin || app.config.timeline.defaultMax)) {
    timeline.setWindow(completeDate(app.config.timeline.defaultMin, 'start'), completeDate(app.config.timeline.defaultMax, 'end'), { animation: false })
  }

  timeline.on('timechanged', (e) => {
    date = moment(e.time).format(urlPrecisionFormats[urlPrecision])
    app.state.apply({ date }, { update: 'push' })
  })
  timeline.on('click', (e) => {
    const item = timeline.itemSet.getItemById(e.item)
    if (item && item.data.isCluster) {
      timeline.setWindow(item.data.min, item.data.max, { animation: true })
      return
    }

    date = moment(e.time).format(urlPrecisionFormats[urlPrecision])
    app.state.apply({ date }, { update: 'push' })
  })
  timeline.on('select', (e) => {
    const selectedItems = dataset.get(e.items)

    if (!selectedItems.length) {
      return
    }

    let start = selectedItems.map(i => i.start).filter(v => v).sort()
    start = start.length ? start[0] : null
    // let end = selectedItems.map(i => i.end).filter(v => v).sort().reverse()
    // end = end.length ? end[0] : null

    let stateChange = {}

    if (selectedItems[0].selectStateChange) {
      stateChange = JSON.parse(selectedItems[0].selectStateChange)
    }

    stateChange.date = start === null ? null : moment(start).format(urlPrecisionFormats[urlPrecision])
    app.state.apply(stateChange, { update: 'push' })
  })
  app.on('state-get', state => {
    state.date = date
  })

  app.on('state-apply', state => {
    if ('date' in state) {
      date = state.date

      if (date) {
        if (!customTime) {
          timeline.addCustomTime()
          timeline.setCustomTimeMarker('Zeitpunkt')
          customTime = true
        }
        timeline.setCustomTime(state.date)
      } else if (customTime) {
        timeline.removeCustomTime()
        customTime = null
      }

      const current = timeline.getWindow()
      const c = completeDate(date)
      if (c && (moment(current.start).format('YYYY-MM-DD') > c ||
          moment(current.end).format('YYYY-MM-DD') < c)) {
        timeline.moveTo(moment(c))
      }
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
      dataset.clear()
      dataset.add(items)
    })
  })
}

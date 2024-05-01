import async from 'async'

import twigGet from './twigGet'
const visTimeline = require('vis-timeline')
const visDataset = require('vis-data')
const moment = require('moment')
const getTimespan = require('./getTimespan')
const completeDate = require('./completeDate')
let app
let dataset
let date = null
let currentBounds
let urlPrecision

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
    app.on('state-apply', stateApply)

    app.state.parameters.date = {
      stringify (v) {
        return moment(v).format(urlPrecisionFormats[urlPrecision])
      },

      parse (v) {
        if (v === 'now') {
          return moment().format('YYYY-MM-DDTHH:mm:ss')
        }

        return v
      }
    }

    callback()
  }
}

let customTime
let timeline

function stateApply (state) {
  const twigContext = {
    state: app.state.current
  }

  const defaultMin = twigGet(app.config.timeline.defaultMin, twigContext)
  const defaultMax = twigGet(app.config.timeline.defaultMax, twigContext)

  if (app.config.timeline && (defaultMin || defaultMax)) {
    if (currentBounds && currentBounds[0] === defaultMin && currentBounds[1] === defaultMax) {
      return
    }

    timeline.setWindow(completeDate(defaultMin, 'start'), completeDate(defaultMax, 'end'), { animation: false })
    currentBounds = [ defaultMin, defaultMax ]
  }
}

let preventClick = null

function init () {
  urlPrecision = app.config.timeline ? app.config.timeline.urlPrecision ?? 'datetime' : 'datetime'
  const options = {
    autoResize: true,
    selectable: true,
    ...(app.config.timeline ? app.config.timeline.options ?? {} : {})
  }

  const container = document.getElementById('timeline')
  dataset = new visDataset.DataSet([])
  timeline = new visTimeline.Timeline(container, dataset, options)

  timeline.on('timechanged', (e) => {
    date = moment(e.time).format('YYYY-MM-DDTHH:mm:ss')
    app.state.apply({ date }, { update: 'push' })
  })
  timeline.on('click', (e) => {
    if (preventClick) { return }

    const item = timeline.itemSet.getItemById(e.item)
    if (item && item.data.isCluster) {
      timeline.setWindow(item.data.min, item.data.max, { animation: true })
      return
    }

    date = moment(e.time).format('YYYY-MM-DDTHH:mm:ss')
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

    preventClick = true
    global.setTimeout(() => preventClick = false, 100)

    stateChange.date = start === null ? null : moment(start).format('YYYY-MM-DDTHH:mm:ss')
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

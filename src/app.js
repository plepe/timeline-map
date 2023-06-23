/* global L:false */
const Twig = require('twig')
const async = require('async')
const visTimeline = require('vis-timeline')
const visDataset = require('vis-data')
const moment = require('moment')

const config = require('./config')

let map
let data
let dateInput
let layer
let features
let styleTemplate
let popupTemplate
let timeline

window.onload = () => {
  async.waterfall([
    done => config.load((err) => done(err))
  ], (err) => {
    if (err) {
      console.error(err)
      return alert(err)
    }

    init()
  })

  map = L.map('map', { maxZoom: 22 })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map)

  dateInput = document.getElementById('date')
  dateInput.value = new Date().toISOString().substr(0, 10)
  dateInput.addEventListener('change', () => {
    const date = moment(dateInput.value).format()
    timeline.setCustomTime(date)
    setDate(date)
  })

  createTimeline()
}

function createTimeline () {
  const options = {
    autoResize: true
  }

  const container = document.getElementById('timeline')
  const items = new visDataset.DataSet([])
  timeline = new visTimeline.Timeline(container, items, options)
  timeline.addCustomTime()
  timeline.on('timechanged', (e) => {
    const date = moment(e.time).format()
    dateInput.value = date
    setDate(date)
  })
  timeline.on('click', (e) => {
    if (!e.item) {
      const date = moment(e.time).format()
      timeline.setCustomTime(date)
      dateInput.value = date
      setDate(date)
      return
    }

    const item = timeline.itemSet.getItemById(e.item)
    if (item.data.isCluster) {
      timeline.setWindow(item.data.min, item.data.max, { animation: true })
    }
    else {
      const date = moment(item.data.start).format()
      timeline.setCustomTime(date)
      dateInput.value = date
      setDate(date)
    }
  })
}

function init () {
  map.setView(config.get('map').location, config.get('map').zoom)

  const select = document.getElementById('source')
  select.onchange = (e) => selectSource(select.value)
  const sources = config.get('sources')
  Object.entries(sources).forEach(([sourceId, sourceDef]) => {
    const option = document.createElement('option')
    option.value = sourceId
    option.appendChild(document.createTextNode(sourceDef.title || sourceId))
    select.appendChild(option)
  })
  selectSource(Object.keys(sources)[0])
}

function hideSource () {
  if (layer) {
    map.removeLayer(layer)
    layer = null
  }
}

function selectSource (sourceId) {
  hideSource()

  const sources = config.get('sources')
  const sourceDef = sources[sourceId]

  styleTemplate = Twig.twig({ data: sourceDef.styleTemplate ?? '{}' })

  fetch(config.get('evaluation').path + '/' + sourceId + '.geojson')
    .then(req => req.json())
    .then(data => {
      const items = new visDataset.DataSet(data.history.map(commit => {
        return {
          id: commit.hash,
          content: commit.date.substr(0, 10),
          start: commit.date
        }
      }))
      timeline.setItems(items)
      timeline.setCustomTimeMarker('Zeitpunkt')
      timeline.setOptions({
        min: data.history[0].date,
        max: new Date(),
        snap: null,
        cluster: {
          titleTemplate: '{count} Zeitpunkte'
        }
      })
      timeline.setWindow(data.history[0].date, new Date())

      layer = L.geoJSON(data, {
        style: (feature) => {
          return JSON.parse(styleTemplate.render({ item: feature }))
        }
      })
        .addTo(map)

      if (sourceDef.popupTemplate) {
        popupTemplate = Twig.twig({ data: sourceDef.popupTemplate })
        layer.bindPopup(layer => {
          return popupTemplate.render({ item: layer.feature })
        })
      }

      setDate(moment().format())
    })
}

function showMap () {
//    .bindPopup((layer) => {
//      return popupTemplate.render({ item: layer.feature })
//    })

//  updateDate()
}

function setDate (date) {
  layer.eachLayer((layer) => {
    const log = layer.feature.log
    let shown = false

    log.forEach(e => {
      if (e[0] === null || e[0] <= date) {
        shown = true
      }
      if (e[1] !== null) {
        if (e[1] <= date) {
        shown = false
      }}
    })

    if (shown) {
      let style = styleTemplate.render({ item: layer.feature })
      style = JSON.parse(style)

      if (!('interactive' in style)) {
        style.interactive = true
      }
      if (!('opacity' in style)) {
        style.opacity = 1
      }

      layer.setStyle(style)
    } else {
      layer.setStyle({ opacity: 0, interactive: false })
    }
  })
}

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
let twigTemplates = {}
let timeline
let allItems

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

  map.createPane('removed')
  map.getPane('removed').style.zIndex = 399
  map.createPane('added')
  map.getPane('added').style.zIndex = 401

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
//    if (!e.item) {
      const date = moment(e.time).format()
      timeline.setCustomTime(date)
      dateInput.value = date
      setDate(date)
      return
//    }

    const item = timeline.itemSet.getItemById(e.item)
    if (item.data.isCluster) {
      timeline.setWindow(item.data.min, item.data.max, { animation: true })
    }
    else {
      const date = moment(item.data.start).format()
      timeline.setCustomTime(date)
      dateInput.value = date
      setDate(date)
      showChange(date)
    }
  })
}

function init () {
  map.setView(config.get('map').location, config.get('map').zoom)

//  const select = document.getElementById('source')
//  select.onchange = (e) => selectSource(select.value)
//  const sources = config.get('sources')
//  Object.entries(sources).forEach(([sourceId, sourceDef]) => {
//    const option = document.createElement('option')
//    option.value = sourceId
//    option.appendChild(document.createTextNode(sourceDef.title || sourceId))
//    select.appendChild(option)
//  })
  selectSource()
}

function hideSource () {
  if (layer) {
    map.removeLayer(layer)
    layer = null
  }
}

function selectSource (sourceId) {
  hideSource()

  const configFeature = config.get('feature')

  styleTemplate = Twig.twig({ data: configFeature.styleTemplate ?? '{}' })

  fetch(config.get('source').url)
    .then(req => req.json())
    .then(data => {
      let min = null
      let max = null
      let timestamps = {}

      data.features.forEach(feature => {
        if (configFeature.type === 'start-end-field') {
          const start = twigGet(configFeature.startField, feature)
          const end = twigGet(configFeature.endField, feature)
          feature.log = [ [ start, end ] ]
        }

        feature.log.forEach(([ start, end ]) => {
          if (start !== null && start !== '') {
            if (min === null || start < min) {
              min = start
            }
            timestamps[start] = true
          }

          if (end !== null && start !== '') {
            if (max === null || end > max) {
              max = end
            }
            timestamps[end] = true
          }
        })
      })

      if (!max) {
        max = new Date()
      }

      timestamps = Object.keys(timestamps).map(t => {
        return { date: t, name: 'Ereignis' }
      })

      const items = new visDataset.DataSet(timestamps.map(entry => {
        return {
          content: entry.date.substr(0, 10),
          start: entry.date
        }
      }))

      //timeline.setItems(items)
      timeline.setCustomTimeMarker('Zeitpunkt')
      timeline.setOptions({
        min, max,
        snap: null,
        cluster: {
          titleTemplate: '{count} Zeitpunkte'
        }
      })
      timeline.setWindow(min, max ?? new Date())

      layer = L.geoJSON(data, {
        style: (feature) => {
          return JSON.parse(styleTemplate.render({ item: feature }))
        }
      })
        .addTo(map)

      allItems = layer.getLayers()

      if (configFeature.popupTemplate) {
        popupTemplate = Twig.twig({ data: configFeature.popupTemplate })
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
  allItems.forEach((item) => {
    const log = item.feature.log
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
      let style = styleTemplate.render({ item: item.feature })
      style = JSON.parse(style)

      if (!('interactive' in style)) {
        style.interactive = true
      }
      if (!('opacity' in style)) {
        style.opacity = 1
      }

      item.addTo(layer)
      if (item.setStyle)
        item.setStyle(style)
    } else {
      layer.removeLayer(item)
    }
  })
}

function showChange (date) {
  layer.eachLayer((layer) => {
    const log = layer.feature.log
    let shown = false

    log.forEach(e => {
      if (e[0] === date) {
        map.removeLayer(layer)
        layer.setStyle({ pane: 'added' })
        layer.addTo(map)
      }
      if (e[1] === date) {
        console.log(layer.feature.properties)
        map.removeLayer(layer)
        layer.setStyle({ pane: 'removed', color: 'black', opacity: 1 })
        layer.addTo(map)
      }
    })
  })

  map.getPane('overlayPane').style.opacity = 0.2
}

function twigGet (template, item) {
  if (!(template in twigTemplates)) {
    twigTemplates[template] = Twig.twig({ data: template })
  }

  return twigTemplates[template].render({ item })
}

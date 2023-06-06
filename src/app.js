/* global L:false */
const Twig = require('twig')
let map
let data
let dateInput
let layer
let features
let styleTemplate

window.onload = () => {
  map = L.map('map', { maxZoom: 22 })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map)

  fetch('config.json')
    .then(req => req.json())
    .then(_config => {
      config = _config
      init()
    })

  dateInput = document.getElementById('date')
  dateInput.value = new Date().toISOString().substr(0, 10)
  dateInput.addEventListener('change', updateDate)
}

function init () {
  map.setView(config.location, config.zoom)

  styleTemplate = Twig.twig({ data: config.style })

  fetch(config.file)
    .then(req => req.json())
    .then(json => {
      data = json
      showMap()
    })
}

function showMap () {
  layer = L.geoJSON(data, {
    style: (feature) => {
      return {}
    }
  })
    .bindPopup((layer) => {
      return layer.feature.properties.STRNAM
    })
    .addTo(map)

  updateDate()
}

function updateDate () {
  const date = dateInput.value
  layer.eachLayer((layer) => {
    const log = layer.feature.properties.log
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

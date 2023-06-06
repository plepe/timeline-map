/* global L:false */
let map

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
}

function init () {
  map.setView(config.location, config.zoom)
}

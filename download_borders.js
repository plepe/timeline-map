const fs = require('fs')
const osmtogeojson = require('osmtogeojson')

fetch('https://overpass-api.openhistoricalmap.org/api/map', {
  method: 'POST',
  body: '[out:json][bbox:41.376,3.472,51.179,29.531];relation[admin_level=2][wikidata~"^Q(40|131964)$"];out body;(way(r:"outer");way(r:"inner"););out body geom;'
})
.then(req => req.json())
.then(body => {
  fs.writeFileSync('borders.osm.json', JSON.stringify(body))

//  const geojson = osmtogeojson(JSON.parse(body))
//  fs.writeFileSync('borders.geojson', JSON.stringify(geojson))
})

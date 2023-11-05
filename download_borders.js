const fs = require('fs')
const osmtogeojson = require('osmtogeojson')

fetch('https://overpass-api.openhistoricalmap.org/api/map', {
  method: 'POST',
  body: '[out:json];(relation[wikidata~"^Q(40|131964|28513|268970)$"];relation[wikidata=Q1206012][start_date~"^19(38|39|4)"];)->.x;.x out body;(way(r.x:"outer");way(r.x:"inner"););out body geom;'
})
.then(req => req.json())
.then(body => {
  fs.writeFileSync('borders.osm.json', JSON.stringify(body))

//  const geojson = osmtogeojson(JSON.parse(body))
//  fs.writeFileSync('borders.geojson', JSON.stringify(geojson))
})

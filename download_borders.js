const fs = require('fs')
const turfSimplify = require('@turf/simplify').default
const osmtogeojson = require('osmtogeojson')

fetch('https://overpass-api.openhistoricalmap.org/api/map', {
  method: 'POST',
  body: '[out:json];(relation[wikidata~"^Q(40|131964|28513|268970)$"];relation[wikidata=Q1206012][start_date~"^19(38|39|4)"];)->.x;.x out body;(way(r.x:"outer");way(r.x:"inner"););out body geom;'
})
.then(req => req.json())
.then(body => {
  fs.writeFileSync('borders-orig.osm.json', JSON.stringify(body))

  const simplified = simplifyBorders(body)
  fs.writeFileSync('borders.osm.json', JSON.stringify(simplified))
})

function simplifyBorders (borders) {
  borders.elements.forEach(element => {
    if (element.type !== 'way') {
      return
    }

    const geoJson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: element.geometry.map(g => [ g.lon, g.lat ])
      }
    }

    const simplified = turfSimplify(geoJson, {
      tolerance: 0.01,
      highQuality: true
    })

    console.log(element.id, '-', element.nodes.length, 'nodes', '->', simplified.geometry.coordinates.length)

    delete element.nodes
    element.geometry = simplified.geometry.coordinates.map(g => {
      return { lon: g[0], lat: g[1] }
    })
  })

  return borders
}

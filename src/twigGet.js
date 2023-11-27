const Twig = require('twig')
import markers from 'openstreetbrowser-markers'
const osmDateQuery = require('openstreetmap-date-query')

Twig.extendFunction('markerLine', (data, options) => Twig.filters.raw(markers.line(data, options)))
Twig.extendFunction('markerCircle', (data, options) => Twig.filters.raw(markers.circle(data, options)))
Twig.extendFunction('markerPointer', (data, options) => Twig.filters.raw(markers.pointer(data, options)))
Twig.extendFunction('markerPolygon', (data, options) => Twig.filters.raw(markers.polygon(data, options)))
Twig.extendFilter('osmDateQuery', (value, options) => osmDateQuery(value, options[0]))
Twig.extendFilter('json_decode', (value) => {
  return JSON.parse(value)
})

const twigTemplates = {}

module.exports = function twigGet (template, data) {
  if (typeof template !== 'string') {
    console.error('Twig template is not a string:', template)
    return ''
  }

  if (!(template in twigTemplates)) {
    try {
      twigTemplates[template] = Twig.twig({ data: template, rethrow: true })
    } catch(e) {
      console.error('Error compiling Twig template:', template, e.message)
      return ''
    }
  }

  return twigTemplates[template].render(data).trim()
}

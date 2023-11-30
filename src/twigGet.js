import markers from 'openstreetbrowser-markers'
const Twig = require('twig')
const osmDateQuery = require('openstreetmap-date-query')

Twig.extendFunction('markerLine', (data, options) => Twig.filters.raw(markers.line(data, options)))
Twig.extendFunction('markerCircle', (data, options) => Twig.filters.raw(markers.circle(data, options)))
Twig.extendFunction('markerPointer', (data, options) => Twig.filters.raw(markers.pointer(data, options)))
Twig.extendFunction('markerPolygon', (data, options) => Twig.filters.raw(markers.polygon(data, options)))
Twig.extendFilter('osmDateQuery', (value, options) => osmDateQuery(value, options[0]))
Twig.extendFilter('debug', (value) => {
  console.log(value)
  return value
})
Twig.extendFilter('json_decode', (value) => {
  return JSON.parse(value)
})

const twigTemplates = {}

module.exports = function twigGet (template, data, callback) {
  if (typeof template !== 'string') {
    console.error('Twig template is not a string:', template)
    return ''
  }

  if (!(template in twigTemplates)) {
    try {
      twigTemplates[template] = Twig.twig({ data: template, rethrow: true })
    } catch (e) {
      console.error('Error compiling Twig template:', template, e.message)
      return ''
    }
  }

  if (callback) {
    twigTemplates[template].renderAsync(data)
      .then(result => callback(null, result.trim()))
  } else {
    return twigTemplates[template].render(data).trim()
  }
}

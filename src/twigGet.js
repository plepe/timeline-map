const Twig = require('twig')
import markers from 'openstreetbrowser-markers'

Twig.extendFunction('markerLine', (data, options) => Twig.filters.raw(markers.line(data, options)))
Twig.extendFunction('markerCircle', (data, options) => Twig.filters.raw(markers.circle(data, options)))
Twig.extendFunction('markerPointer', (data, options) => Twig.filters.raw(markers.pointer(data, options)))
Twig.extendFunction('markerPolygon', (data, options) => Twig.filters.raw(markers.polygon(data, options)))

const twigTemplates = {}

module.exports = function twigGet (template, data) {
  if (!(template in twigTemplates)) {
    twigTemplates[template] = Twig.twig({ data: template })
  }

  return twigTemplates[template].render(data)
}

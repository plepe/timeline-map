const Twig = require('twig')
const osmDateQuery = require('openstreetmap-date-query')

Twig.extendFilter('osmDateQuery', (value, options) => osmDateQuery(value, options[0]))
Twig.extendFilter('debug', (value) => {
  console.log(value)
  return value
})
Twig.extendFilter('json_decode', (value) => {
  return typeof value === 'string' ? JSON.parse(value) : null
})

const twigTemplates = {}

module.exports = require('geowiki-viewer/src/twigGet')

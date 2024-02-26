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

module.exports = function twigGet (template, data, callback) {
  if (typeof template !== 'string') {
    console.error('Twig template is not a string:', template)
    return template
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

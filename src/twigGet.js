const Twig = require('twig')

const twigTemplates = {}

module.exports = function twigGet (template, item) {
  if (!(template in twigTemplates)) {
    twigTemplates[template] = Twig.twig({ data: template })
  }

  return twigTemplates[template].render({ item })
}

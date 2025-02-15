const Twig = require('twig')

const operators = {
  '==': (a, b) => a == b,
  '!=': (a, b) => a != b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  'in': (a, b) => b.includes(a),
}

Twig.extendFilter('filter_objects', (list, options) => {
  if (options.length < 2) {
    throw new Error("'filter_objects': minimum 2 parameters expected")
  }

  const property = options.shift()
  const operator = operators[options.length > 1 ? options.shift() : '==']
  const value = options.shift()

  if (!Array.isArray(list)) {
    return []
  }

  return list.filter(item => operator(value, item[property]))
})

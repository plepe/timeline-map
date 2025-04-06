const Twig = require('twig')
const relations = {}

module.exports = {
  id: 'relations',
  requireModules: ['config'],
  appInit (app) {
    app.on('init', (promises) => {
      if (!app.config.relations) {
        return
      }

      promises.push(new Promise((resolve, reject) => {
        const promises = Object.entries(app.config.relations).map(
          ([id, config]) => {
            const relation = new Relation(id, config)
            relations[id] = relation
            return relation.init()
          }
        )

        Promise.all(promises)
          .then(() => resolve())
          .catch(() => reject())
      }))
    })
  }
}

class Relation {
  constructor (id, config) {
    this.id = id
    this.config = config
  }

  init () {
    return new Promise((resolve, reject) => {
      if (this.config.source) {
        fetch(this.config.source)
          .then(req => req.json())
          .then(result => {
            this.data = {}

            result.forEach(item => {
              const id = item[this.config.idField || 'id']
              this.data[id] = item
            })

            resolve()
          })
      }
      else {
        resolve()
      }
    })
  }

  list () {
    return Object.values(this.data)
  }

  get (id) {
    return this.data[id]
  }
}

Twig.extendFunction('relationGet', (relationType, id) => {
  if (!(relationType in relations)) {
    return
  }

  return relations[relationType].get(id)
})

Twig.extendFunction('relationQuery', (relationType, query) => {
  if (!(relationType in relations)) {
    return
  }

  return relations[relationType].list().filter(item =>
    query.filter(([key, value, op]) => {
      switch (op) {
        case '<':
          return item[k] < value
        case '<=':
          return item[k] <= value
        case '>':
          return item[k] > value
        case '>=':
          return item[k] >= value
        case '!=':
          return item[k] != value
        case '==':
        default:
          return item[key] == value
      }
    }).length
  )
})

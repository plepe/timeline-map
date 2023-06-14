const fs = require('fs')
const async = require('async')

const config = require('./config')

module.exports = {
  download (callback) {
    const repConfig = config.get('repository')
    const srcConfig = config.get('sources')

    async.eachOf(srcConfig,
      (def, key, done) => {
        fetch(def.url)
          .then(req => req.json())
          .then(json => {
            json = modifySource(json, def)

            fs.writeFile(repConfig.path + '/' + key + '.geojson',
              JSON.stringify(json, null, '  '),
              (err) => done(err)
            )
          })
      }, (err) => callback(err))
  }
}

function modifySource (data, def) {
  if (def.sortBy) {
    data.features.sort((a, b) => {
      const va = valueGet(a, def.sortBy.split('.'))
      const vb = valueGet(b, def.sortBy.split('.'))
      return va < vb ? -1 : 1
    })
  }

  return data
}

function valueGet (data, path) {
  const v = path[0] in data ? data[path[0]] : null
  if (path.length > 1) {
    if (v === 0) {
      return null
    }
    return valueGet(v, path.slice(1))
  }

  return v
}

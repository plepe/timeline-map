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
            fs.writeFile(repConfig.path + '/' + key + '.geojson',
              JSON.stringify(json, null, '  '),
              (err) => done(err)
            )
          })
      }, (err) => callback(err))
  }
}

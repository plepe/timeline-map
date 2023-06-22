const async = require('async')

const config = require('./config')
const repository = require('./repository')

module.exports = {
  build (callback) {
    const sourcesConfig = config.get('sources')

    async.each(Object.keys(sourcesConfig), (sourceId, done) => { 
      repository.log({ file: sourceId + '.geojson' }, (err, result) => {
        if (err) { return done(err) }

        console.log(sourceId, result)
        done()
      })
    }, (err) => callback(err))
  }
}

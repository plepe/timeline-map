const async = require('async')

const config = require('./config')
const repository = require('./repository')

module.exports = {
  build (callback) {
    const sourcesConfig = config.get('sources')

    async.each(Object.keys(sourcesConfig), (sourceId, done) => {
      const file = sourceId + '.geojson'

      repository.log({ file }, (err, history) => {
        if (err) { return done(err) }

        async.eachSeries(history, (commit, done) => {
          repository.getFile({ file, hash: commit.hash }, (err, body) => {
            console.log(body)
            done()
          })

        }, (err) => done(err))
      })
    }, (err) => callback(err))
  }
}

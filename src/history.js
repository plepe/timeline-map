const fs = require('fs')
const async = require('async')

const config = require('./config')
const repository = require('./repository')

module.exports = {
  check (callback) {
    const evalConfig = config.get('evaluation')

    async.waterfall([
      (done) => fs.lstat(evalConfig.path,
        (err, stat) => {
          if (err) {
            if (err.code === 'ENOENT') {
              return fs.mkdir(evalConfig.path, (err) => done(err))
            }

            return done(err)
          }

          if (!stat.isDirectory()) {
            return done(new Error('Evaluation path is not a directory!'))
          }

          done()
        }
      )
    ], (err) => callback(err))
  },

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

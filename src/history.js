const fs = require('fs')
const async = require('async')
const md5 = require('md5')

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
    const evalConfig = config.get('evaluation')

    async.each(Object.keys(sourcesConfig), (sourceId, done) => {
      const file = sourceId + '.geojson'
      const features = {}
      let first = true

      repository.log({ file }, (err, history) => {
        if (err) { return done(err) }

        async.eachSeries(history, (commit, done) => {
          repository.getFile({ file, hash: commit.hash }, (err, body) => {
            const data = JSON.parse(body)
            const found = {}

            data.features.forEach(feature => {
              const id = md5(JSON.stringify(feature))
              found[id] = true

              if (id in features) {
                const log = features[id].log
                if (log[log.length - 1][1]) {
                  features[id].log.push([ commit.date, null ])
                }
              } else {
                feature.log = [[ first ? null : commit.date, null ]]
                features[id] = feature
              }
            })

            // mark all vanished items
            Object.keys(features).forEach(id => {
              const log = features[id].log
              if (!(id in found) && log[log.length - 1][1] === null) {
                features[id].log[log.length - 1][1] = date
              }
            })

            first = false
            done()
          })
        }, (err) => {
          if (err) { return done(err) }
          fs.writeFile(evalConfig.path + '/' + sourceId + '.geojson', JSON.stringify({
            type: 'FeatureCollection',
            features: Object.values(features)
          }), (err) => done(err))
        })
      })
    }, (err) => callback(err))
  }
}

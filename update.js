const async = require('async')

const config = require('./src/config')
const repository = require('./src/repository')
const sources = require('./src/sources')
const history = require('./src/history')

async.waterfall([
  (done) => config.load(done),
  (done) => repository.check(done),
  (done) => history.check(done),
  (done) => sources.download(done),
  (done) => repository.commit(done)
  (done) => history.build(done)
], (err) => {
  if (err) { console.error(err) }
})

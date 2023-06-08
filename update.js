const async = require('async')

const config = require('./src/config')
const repository = require('./src/repository')

async.waterfall([
  (done) => config.load(done),
  (done) => repository.check(done),
], (err) => {
  if (err) { console.error(err) }
})

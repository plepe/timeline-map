const fs = require('fs')
const async = require('async')
const childProcess = require('child_process')

const config = require('./config')

module.exports = {
  check (callback) {
    const repConfig = config.get('repository')

    async.waterfall([
      (done) => fs.lstat(repConfig.path,
        (err, stat) => {
          if (err) {
            if (err.code === 'ENOENT') {
              return createRepository(repConfig, done)
            }

            return done(err)
          }

          if (!stat.isDirectory()) {
            return done(new Error('Repository path is not a directory!'))
          }

          done()
        }
      ),
      (done) => fs.lstat(repConfig.path + '/.git',
        (err, stat) => {
          if (err) { return done(err) }

          if (!stat.isDirectory()) {
            return done(new Error('Repository path is not a git repository!'))
          }

          done()
        }
      )
    ], (err) => callback(err))
  },

  commit (callback) {
    const repConfig = config.get('repository')

    async.waterfall([
      (done) => childProcess.execFile('git', ['add', '*'], {
        cwd: repConfig.path
      }, (err) => done(err)),
      (done) => childProcess.execFile('git', ['commit', '-m', 'snapshot'], {
        cwd: repConfig.path
      }, (err) => done(err))
    ], (err) => callback(err))
  }
}

function createRepository (repConfig, callback) {
  async.waterfall([
    (done) => fs.mkdir(repConfig.path, (err) => done(err)),
    (done) => childProcess.execFile('git', ['init'], {
        cwd: repConfig.path
      }, (err) => done(err))
  ], (err) => {
    if (err) { return callback(err) }
    console.error("Repository initialized")
    callback()
  })
}

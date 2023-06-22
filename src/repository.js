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
  },

  log (options, callback) {
    const cmd = ['log', '--pretty=%H %aI %s']
    if (options.file) {
      cmd.push('--')
      cmd.push(options.file)
    }

    childProcess.execFile('git', cmd, { cwd: 'data/' }, (err, result) => {
      if (err) { return callback(err) }

      result = result
        .trimEnd()
        .split('\n')
        .reverse()
        .map(str => {
          str = str.split(' ')

          return {
            hash: str.shift(),
            date: str.shift(),
            subject: str.join(' ')
          }
        })

      callback(null, result)
    })
  },

  getFile (options, callback) {
    const cmd = ['show', options.hash + ':' + options.file]

    childProcess.execFile('git', cmd, { cwd: 'data/', maxBuffer: 128 * 1024 * 1024 }, callback)
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

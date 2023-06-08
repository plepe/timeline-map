const fs = require('fs')
const yaml = require('js-yaml')

let config

module.exports = {
  load (callback) {
    fs.readFile('config.yaml',
      (err, file) => {
        if (err) { return callback(err) }
        config = yaml.load(file)

        if (!config.repository && !config.repository.path) {
          return callback(new Error('No repository path defined!'))
        }

        callback()
      }
    )
  },

  get (key) {
    return config[key]
  }
}

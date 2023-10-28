const fs = require('fs')
const yaml = require('js-yaml')

let config

module.exports = {
  load (callback) {
    loadFile('config.yaml',
      (err, file) => {
        if (err) { return callback(err) }
        config = yaml.load(file)

        callback()
      }
    )
  },

  get (key) {
    return config[key]
  }
}

function loadFile (file, callback) {
  if (fs && fs.readFile) {
    fs.readFile(file, callback)
  } else {
    fetch(file)
      .then(req => req.text())
      .then(body => callback(null, body))
  }
}

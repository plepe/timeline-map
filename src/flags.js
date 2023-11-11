import App from 'geowiki-viewer/src/App'
const Twig = require('twig')

let app
let timeout
const flags = {}

function set (k, v) {
  flags[k] = v

  if (!timeout) {
    timeout = global.setTimeout(() => {
      timeout = null
      app.state.apply({})
    }, 0)
  }
}

function get (k) {
  return flags[k]
}

Twig.extendFunction('setFlag', set)
Twig.extendFunction('getFlag', get)

App.addExtension({
  id: 'flags',
  initFun: (_app, callback) => {
    app = _app
    callback()
  }
})

module.exports = { get, set }

import App from 'geowiki-viewer/src/App'
const Twig = require('twig')
import './refresh'

let app
const flags = {}

function set (k, v) {
  if (!(k in flags) || JSON.stringify(flags[k]) !== JSON.stringify(v)) {
    flags[k] = v
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

import App from 'geowiki-viewer/src/App'
import './refresh'
const Twig = require('twig')

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
  initFun: (app, callback) => {
    callback()
  }
})

module.exports = { get, set }

import App from 'geowiki-viewer/src/App'

const modules = [
  require('geowiki-viewer/src/lang'),
  require('geowiki-viewer/src/map'),
  require('geowiki-viewer/src/config'),
  require('./timeline'),
  require('./layers'),
  require('./timeline-controls'),
  require('./addParam'),
  require('./overlays'),
  require('./flags'),
  require('./focusData'),
  require('./sidebar'),
  require('./resize'),
  require('./panes'),
]

App.modules = [...App.modules, ...modules, ...require('../modules')]

window.onload = function () {
  window.app = new App()
}

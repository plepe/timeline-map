import App from 'geowiki-viewer/src/App'
import 'geowiki-viewer/src/lang'
import 'geowiki-viewer/src/map'
import 'geowiki-viewer/src/config'
import './timeline'
import './layers'
import './timeline-controls'
import './addParam'
import './overlays'
import './flags'
import './fullscreen'
import './focusData'
import './sidebar'

window.onload = function () {
  window.app = new App()
}

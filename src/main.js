import App from 'geowiki-viewer/src/App'
import 'geowiki-viewer/src/lang'
import 'geowiki-viewer/src/map'
import 'geowiki-viewer/src/config'
import './timeline'
import './timeline-controls'
import './TimelineGeoJSON'
import './TimelineJSON'
import './overlays'
import './flags'

window.onload = function () {
  return new App()
}

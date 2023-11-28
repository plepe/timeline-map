import Events from 'events'
import twigGet from './twigGet'
import TimelineJSON from './TimelineJSON'

module.exports = class TimelineGeoJSON extends TimelineJSON {
  constructor (app, config) {
    config.feature.geomField = '_geom'
    config.feature.geomType = 'geojson'
    super(app, config)
  }

  init () {
    this.data = this.data.features.map(f => {
      const item = f.properties
      item._geom = f.geometry
      return item
    })

    super.init()
  }
}

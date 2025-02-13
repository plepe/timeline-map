require('leaflet.markercluster')

const clusterGroups = {}

module.exports = {
  id: 'cluster',
  appInit (app) {
    app.on('init', () => {
      if (app.config.clusterGroups) {
        Object.entries(app.config.clusterGroups).forEach(([id, config]) => {
          clusterGroups[id] = L.markerClusterGroup(config || {})
          app.map.addLayer(clusterGroups[id])

          clusterGroups[id].bindPopup(feature => {
            if (feature.feature.properties.layer) {
              return feature.feature.properties.layer.getPopupContent(feature)
            }
          })
        })
      }
    })

    app.on('timeline-json-init', (layer) => {
      if (!layer.config.feature.cluster) {
        return
      }

      const origFeatureAdd = layer._featureAdd.bind(layer)
      const origFeatureRemove = layer._featureRemove.bind(layer)

      layer._featureAdd = function (feature, item) {
        const cluster = item.evaluate(item.config.feature.cluster)

        if (cluster && clusterGroups[cluster]) {
          clusterGroups[cluster].addLayer(feature)
          feature._timeline_cluster = cluster
          return
        }

        feature._timeline_cluster = null
        origFeatureAdd(feature)
      }

      layer._featureRemove = function (feature, item) {
        if (feature._timeline_cluster) {
          clusterGroups[feature._timeline_cluster].removeLayer(feature)
          return
        }

        origFeatureRemove(feature)
      }
    })
  }
}

import yaml from 'js-yaml'
import App from 'geowiki-viewer/src/App'
import twigGet from './twigGet'

App.addExtension({
  id: 'panes',
  requireExtensions: ['config', 'map'],
  initFun: (app, callback) => {
    app.map.once('layeradd', () => {
      if (app.config.panes) {
        if (typeof app.config.panes === 'string') {
          const p = twigGet(app.config.panes, {})
          app.config.panes = yaml.load(p)
        }

        Object.entries(app.config.panes).forEach(([k, def]) => {
          const pane = app.map.createPane(k)

          if (typeof def === 'object') {
            Object.entries(def).forEach(([style, v]) => {
              pane.style[style] = v
            })
          }
        })
      }
    })

    callback()
  }
})

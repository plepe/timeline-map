import yaml from 'js-yaml'
import App from './App'
import state from './state'

// the config which has been defined here or in config.yaml
import defaultConfig from './defaultConfig.json'

App.addExtension({
  id: 'config',
  initFun
})

function initFun (app, callback) {
  app.config = defaultConfig

  global.fetch('config.yaml', {
    method: 'POST'
  })
    .then(req => {
      if (req.status === 404) {
        // not found, using default config
        return '{}'
      }

      if (req.ok) {
        return req.text()
      }

      throw (new Error("Can't load file config.yaml: " + req.statusText))
    })
    .then(body => {
      const _config = yaml.load(body)
      app.config = { ...app.config, ..._config }

      app.options = { ...app.config }
      app.options = { ...app.options, ...state.parse() }

      global.setTimeout(() => callback(), 0)
    })
    .catch(err => {
      const error = new Error('Error loading config file (' + err.message + ')')
      global.setTimeout(() => callback(error), 0)
    })
}

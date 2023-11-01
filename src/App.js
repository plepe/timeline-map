import Events from 'events'
import state from './state'
import each from 'async/each'

const extensions = {}

class App extends Events {
  constructor () {
    super()

    this.initExtensions(() => this.init())
  }

  initExtensions (callback) {
    const loadableExtensions = Object.entries(extensions)
      .filter(([id, extension]) => {
        if (extension.done) {
          return false
        }

        if (extension.requireExtensions) {
          if (!extension.requireExtensions.filter(rId => extensions[rId] && extensions[rId].done).length) {
            console.log('req', extension.requireExtensions)
            return false
          }
        }

        return true
      })

    console.log('loadable', loadableExtensions)
    if (!loadableExtensions.length) {
      return callback()
    }

    each(loadableExtensions, ([id, extension], done) => {
      console.log('start', id)
      if (!extension.initFun) {
        extension.done = true
        return done()
      }

      extension.initFun(this, (err) => {
        if (err) {
          console.log('error init', id, err)
          return global.alert(err.message)
        }

        extension.done = true
        console.log('done', id)
        return done()
      })
    }, () => this.initExtensions(callback))
  }

  init () {
    state.on('get', state => this.emit('state-get', state))
    state.on('apply', state => this.emit('state-apply', state))

    this.emit('init')
    state.init()

    const initState = { ...this.options.defaultState, ...state.parse() }
    state.apply(initState)
  }

  stateApply (s) {
    state.apply(s)
  }

  updateLink () {
    state.updateLink()
  }

  getParameter (str) {
    const promises = []
    this.emit(str, promises)
    return Promise.any(promises)
  }

  setNonInteractive (value) {
    this.interactive = !value
  }
}

App.addExtension = (extension) => {
  extensions[extension.id] = extension
}

module.exports = App

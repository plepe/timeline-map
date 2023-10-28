import Events from 'events'
import queryString from 'query-string'
import hash from 'sheet-router/hash'

class State extends Events {
  constructor () {
    super()
  }

  init () {
    hash(loc => {
      this.apply(loc.substr(1))
    })
  }

  get () {
    const state = {}

    // other modules
    this.emit('get', state)

    return state
  }

  apply (state = null) {
    if (!state || typeof state === 'string') {
      state = this.parse(state)
    }

    // other modules
    this.emit('apply', state)

    return state
  }

  stringify (state = null) {
    let link = ''

    if (!state) {
      state = this.get()
    }

    // avoid modification of the object
    state = { ...state }

    // path
    if (state.path) {
      link += state.path
      delete state.path
    }

    // location
    let locPrecision = 5
    if (state.zoom) {
      locPrecision =
        state.zoom > 16
          ? 5
          : state.zoom > 8
            ? 4
            : state.zoom > 4
              ? 3
              : state.zoom > 2
                ? 2
                : state.zoom > 1
                  ? 1
                  : 0
    }

    if (state.zoom && state.lat && state.lon) {
      link += (link === '' ? '' : '&') + 'map=' +
        parseFloat(state.zoom).toFixed(0) + '/' +
        state.lat.toFixed(locPrecision) + '/' +
        state.lon.toFixed(locPrecision)

      delete state.zoom
      delete state.lat
      delete state.lon
    }

    let newHash = queryString.stringify(state)

    // Characters we don't want escaped
    newHash = newHash.replace(/%2F/g, '/')
    newHash = newHash.replace(/%2C/g, ',')

    if (newHash !== '') {
      link += (link === '' ? '' : '&') + newHash
    }

    return link
  }

  parse (link = null) {
    if (!link) {
      link = global.location.hash
    }

    const firstEquals = link.search('=')
    const firstAmp = link.search('&')
    let urlNonPathPart = ''
    let newState = {}
    let newPath = ''

    if (link === '') {
      // nothing
    } else if (firstEquals === -1) {
      if (firstAmp === -1) {
        newPath = link
      } else {
        newPath = link.substr(0, firstAmp)
      }
    } else {
      if (firstAmp === -1) {
        urlNonPathPart = link
      } else if (firstAmp < firstEquals) {
        newPath = link.substr(0, firstAmp)
        urlNonPathPart = link.substr(firstAmp + 1)
      } else {
        urlNonPathPart = link
      }
    }

    newState = queryString.parse(urlNonPathPart)
    if (newPath !== '') {
      newState.path = newPath
    }

    if ('map' in newState && newState.map !== 'auto') {
      const parts = newState.map.split('/')
      newState.zoom = parseFloat(parts[0])
      newState.lat = parseFloat(parts[1])
      newState.lon = parseFloat(parts[2])
      delete newState.map
    }

    return newState
  }

  updateLink () {
    global.history.replaceState(null, null, '#' + this.stringify())
  }
}

module.exports = new State()

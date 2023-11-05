import Events from 'events'
import twigGet from './twigGet'

const Twig = require('twig')

module.exports = class TimelineTimestamps extends Events {
  constructor (app, config) {
    super()
    this.app = app
    this.source = config.source
    this.config = config.feature
    this.reqParameter = this.source.reqParameter ?? []
    this.parameter = {}

    this.app.on('state-apply', state => {
      if (this.reqParameter.filter(k => k in state).length === this.reqParameter.length) {
        this.reqParameter.forEach(k => {
          this.parameter[k] = state[k]
        })

        const url = twigGet(this.source.url, state)
        if (this.url !== url) {
          this.data = null

          this.hide()
          this.load(url, () => {
            this.init()
            this.show()
          })
        }
      }
    })

    this.app.on('state-get', state => {
      Object.entries(this.parameter).forEach(([k, v]) => {
        state[k] = v
      })
    })

    ;['start', 'end'].forEach(p => {
      this.app.on('default-' + p + '-date', promises => {
        promises.push(new Promise((resolve, reject) => {
          const starts = this.allItems
            .map(item => twigGet(this.config[p + 'Field'], { item: item.feature }))
            .filter(v => v)
            .sort()

          if (starts.length) {
            resolve(starts[p === 'end' ? starts.length - 1 : 0])
          } else {
            reject()
          }
        }))
      })
    })
  }

  load (url, callback) {
    this.url = url
    fetch(this.url)
      .then(req => req.json())
      .then(data => {
        this.data = data
        callback(null)
      })
  }

  init () {
    this.min = '99999'
    this.max = '0'
    this.timestamps = {}

    this.allItems = this.data.map(item => {
      let result = {}

      if (this.config.type === 'start-end-field') {
        result.start = twigGet(this.config.startField, { item })
        result.end = twigGet(this.config.endField, { item })
      } else if (this.config.type === 'function') {
        result = JSON.parse(twigGet(this.config.logFunction, { item }))
      }

      result.content = twigGet(this.config.contentField, { item })
      result.type = twigGet(this.config.typeField, { item })

      return result
    })

    this.app.emit('timeline-dataset', this.allItems)

    //this.emit('data-loaded')
    //this.app.emit('data-loaded', this)
  }

  show () {
  }

  hide () {
  }

  setDate (date) {
  }
}

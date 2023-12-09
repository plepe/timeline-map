import Events from 'events'
import twigGet from './twigGet'
import isTrue from './isTrue'
import applyPopupModifier from './applyPopupModifier'

module.exports = class ContentDisplay extends Events {
  constructor (config) {
    super()
    this.config = config

    this.div = document.createElement('div')
  }

  show (data) {
    if (this.config.template) {
      const content = twigGet(this.config.template, data)
      this.div.innerHTML = content
      this.emit('ready')
    }

    if (this.config.source) {
      const url = twigGet(this.config.source.url, data)
      fetch(url)
        .then(req => req.text())
        .then(body => {
          if (this.config.source.querySelector) {
            const x = document.createElement('div')
            x.innerHTML = body

            const content = x.querySelector(this.config.source.querySelector)
            if (content) {
              body = content.innerHTML
            }
          }

          this.div.innerHTML = body
          applyPopupModifier(this.div, this.config.source.modifier, data)
          this.emit('ready')
        })
    }
  }
}
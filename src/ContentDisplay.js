import Events from 'events'
import twigGet from './twigGet'
import applyPopupModifier from './applyPopupModifier'

module.exports = class ContentDisplay extends Events {
  constructor (config) {
    super()
    this.config = config

    this.content = document.createElement('div')
  }

  show (data) {
    if (this.config.template) {
      const content = twigGet(this.config.template, data)
      this.content.innerHTML = content
      this.update(data)
      this.emit('ready')
    }

    if (this.config.source) {
      const url = twigGet(this.config.source.url, data)
      if (!url || url === this.url) {
        this.update(data)
        return
      }

      this.url = url
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

          this.content.innerHTML = body
          applyPopupModifier(this.content, this.config.source.modifier, data)
          this.update(data)
          this.emit('ready')
        })
    }
  }

  update (data) {
    if (this.config.update) {
      applyPopupModifier(this.content, this.config.update, data)
    }
  }
}

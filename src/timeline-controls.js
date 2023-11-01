const moment = require('moment')

import App from './App'
import state from './state'

const inputs = {}

App.addExtension({
  id: 'timeline-controls',
  initFun: (app, callback) => {
    inputs.date = document.getElementById('date')
    inputs.date.value = new Date().toISOString().substr(0, 10)
    inputs.date.addEventListener('change', () => {
      date = moment(inputs.date.value).format()
      app.updateLink()
      state.apply({ date })
    })

    ;['backward', 'forward'].forEach(v => {
      inputs[v] = document.querySelector('button[name=' + v + ']')
      inputs[v].addEventListener('click', () => {
        let date = moment(state.get().date)
        date = v == 'backward' ? date.subtract(1, 'M') : date.add(1, 'M')
        date = date.format('YYYY-MM-DD')
        state.apply({ date })
        app.updateLink()
      })
    })

    app.on('state-apply', state => {
      if ('date' in state) {
        inputs.date.value = state.date
      }
    })

    callback()
  }
})

const moment = require('moment')

import App from './App'
import state from './state'

const inputs = {}
let stepSize = [ '1', 'M' ]

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
        date = v == 'backward' ? date.subtract(...stepSize) : date.add(...stepSize)
        date = date.format('YYYY-MM-DD')
        state.apply({ date })
        app.updateLink()
      })
    })

    inputs.stepSize = document.querySelector('select[name=stepSize]')
    stepSize = parseStepSize(inputs.stepSize.value)
    inputs.stepSize.addEventListener('change', () => {
      stepSize = parseStepSize(inputs.stepSize.value).join('')
      state.apply({ stepSize })
    })

    app.on('state-apply', state => {
      if ('date' in state) {
        inputs.date.value = state.date
      }

      if ('stepSize' in state) {
        inputs.stepSize.value = state.stepSize
        stepSize = parseStepSize(state.stepSize)
      }
    })

    callback()
  }
})

function parseStepSize (str) {
  return Array.from(str.match(/^([0-9]+)([A-Za-z])+$/)).slice(1)
}

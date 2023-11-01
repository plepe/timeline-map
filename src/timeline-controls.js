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

    app.on('state-apply', state => {
      if ('date' in state) {
        inputs.date.value = state.date
      }
    })

    callback()
  }
})

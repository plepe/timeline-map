import App from './App'
import state from './state'

let dateInput

App.addExtension({
  id: 'timeline-controls',
  initFun: (app, callback) => {
    dateInput = document.getElementById('date')
    dateInput.value = new Date().toISOString().substr(0, 10)
    dateInput.addEventListener('change', () => {
      date = moment(dateInput.value).format()
      app.updateLink()
      state.apply({ date })
    })

    app.on('state-apply', state => {
      if ('date' in state) {
        dateInput.value = state.date
      }
    })

    callback()
  }
})

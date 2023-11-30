import App from 'geowiki-viewer/src/App'

const moment = require('moment')
const getTimespan = require('./getTimespan')

const inputs = {}
let stepSize = ['1', 'M']
let interval

App.addExtension({
  id: 'timeline-controls',
  initFun: (app, callback) => {
    const getDate = (p) => new Promise((resolve, reject) => {
      const date = app.state.current.date
      if (date) {
        return resolve(date)
      }

      return getTimespan(app)
        .then(v => {
          console.log(v)
          resolve(v[p])
        })
        .catch(err => {
          console.error(err)
          reject(err)
          global.alert('Kein ' + p + ' Datum gefunden')
        })
    })

    const setActive = (active) => {
      let date = app.state.current.date
      if (!date) {
        return getDate('start').then(date => {
          app.state.apply({ date })
          setActive(active)
        })
      }

      if (active) {
        inputs.play.innerHTML = '<i class="fa-solid fa-pause"></i>'
        interval = global.setInterval(() => {
          date = moment(app.state.current.date)
          date = date.add(...stepSize)
          date = date.format('YYYY-MM-DD')
          app.state.apply({ date })
          app.updateLink()
        }, 1000)
      } else {
        inputs.play.innerHTML = '<i class="fa-solid fa-play"></i>'
        global.clearInterval(interval)
        interval = null
      }
    }

    inputs.date = document.getElementById('date')
    inputs.date.addEventListener('change', () => {
      let date = inputs.date.value
      if (date !== '') {
        date = moment(date, ['LL', 'YYYY-MM-DD', 'D.M.YYYY'], 'de').format('YYYY-MM-DD').substr(0, 10)
      }

      app.state.apply({ date })
      app.updateLink()
    })

    ;['backward', 'forward'].forEach(v => {
      inputs[v] = document.querySelector('button[name=' + v + ']')
      inputs[v].addEventListener('click', () => {
        setActive(false)
        getDate(v === 'forward' ? 'start' : 'end').then(date => {
          date = moment(date)
          date = v === 'backward' ? date.subtract(...stepSize) : date.add(...stepSize)
          date = date.format('YYYY-MM-DD')
          app.state.apply({ date })
          app.updateLink()
        })
      })
    })

    inputs.play = document.querySelector('button[name=play]')
    inputs.play.addEventListener('click', () => setActive(!interval))

    inputs.stepSize = document.querySelector('select[name=stepSize]')
    stepSize = parseStepSize(inputs.stepSize.value)
    inputs.stepSize.addEventListener('change', () => {
      stepSize = parseStepSize(inputs.stepSize.value).join('')
      app.state.apply({ stepSize })
    })

    app.on('state-apply', state => {
      if ('date' in state) {
        inputs.date.value = state.date ? moment(state.date).format('YYYY-MM-DD') : ''
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

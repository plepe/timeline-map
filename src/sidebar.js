import App from 'geowiki-viewer/src/App'
import twigGet from './twigGet'
import isTrue from './isTrue'
import ContentDisplay from './ContentDisplay'
import './resize'

let sidebar, contentDisplay, resizer
let drag = false
let app

App.addExtension({
  id: 'sidebar',
  initFun: (_app, callback) => {
    app = _app
    app.on('init', init)
    callback()
  }
})

function init () {
  const config = app.config.sidebar
  if (!config) {
    return
  }

  app.on('state-apply', () => {
    if (typeof config.show === 'boolean' ? config.show : isTrue(twigGet(app.config.sidebar.show, { state: app.state.current }))) {
      document.body.classList.add('sidebar')

      contentDisplay.show({
        state: app.state.current
      })
    } else {
      document.body.classList.remove('sidebar')
    }

    app.resize()
  })

  sidebar = document.createElement('aside')
  document.body.appendChild(sidebar)

  contentDisplay = new ContentDisplay(app.config.sidebar)
  contentDisplay.content.className = 'content'
  sidebar.appendChild(contentDisplay.content)

  contentDisplay.on('ready', () => {
    app.emit('sidebar-ready', contentDisplay)
  })

  resizer = document.createElement('div')
  resizer.className = 'resizer'
  sidebar.appendChild(resizer)

  resizer.addEventListener('mousedown', start)
  resizer.addEventListener('touchstart', start)

  document.body.addEventListener('touchmove', move)
  document.body.addEventListener('mousemove', move)

  document.body.addEventListener('mouseup', stop)
  document.body.addEventListener('touchend', stop)
}

function start (e) {
  drag = true
  e.preventDefault()
}

function move (e) {
  if (drag) {
    const pos = e.clientX ?? (e.touches.length ? e.touches[0].clientX : undefined)
    if (e.buttons === 0) {
      drag = false
    } else {
      document.body.style.gridTemplateColumns = pos + 'px auto'
      app.resize()
    }
    e.preventDefault()
  }
}

function stop (e) {
  if (drag) {
    drag = false
    e.preventDefault()
  }
}

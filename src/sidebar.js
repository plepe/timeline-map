import App from 'geowiki-viewer/src/App'
import twigGet from './twigGet'
import isTrue from './isTrue'

let sidebar, content, resizer
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
    } else {
      document.body.classList.remove('sidebar')
    }
  })

  sidebar = document.createElement('aside')
  document.body.appendChild(sidebar)

  content = document.createElement('div')
  content.className = 'content'
  sidebar.appendChild(content)

  resizer = document.createElement('div')
  resizer.className = 'resizer'
  resizer.innerHTML = '‖'
  sidebar.appendChild(resizer)

  resizer.onmousedown = (e) => {
    drag = true
    return false
  }

  document.body.onmousemove = (e) => {
    if (drag) {
      document.body.style.gridTemplateColumns = e.clientX + 'px auto'
      return false
    }

  }

  document.body.onmouseup = (e) => {
    if (drag) {
      drag = false
      return false
    }
  }
}

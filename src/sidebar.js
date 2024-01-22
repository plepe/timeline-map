import twigGet from './twigGet'
import isTrue from './isTrue'
import ContentDisplay from './ContentDisplay'

let sidebar, contentDisplay, resizer
let isVertical = false
let drag = false
let app

module.exports = {
  id: 'sidebar',
  requireModules: ['resize'],
  appInit: (_app, callback) => {
    app = _app
    app.on('init', init)
    callback()
  }
}

function init () {
  const config = app.config.sidebar
  if (!config) {
    return
  }

  app.on('state-apply', () => {
    if (typeof config.show === 'boolean' ? config.show : isTrue(twigGet(app.config.sidebar.show, { state: app.state.current }))) {
      document.body.classList.add('sidebar-active')

      contentDisplay.show({
        state: app.state.current
      })
    } else {
      document.body.classList.remove('sidebar-active')
    }

    app.resize()
  })

  app.on('resize', resize)
  window.addEventListener('resize', resize)

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
    const prop = isVertical ? 'clientY' : 'clientX'

    let pos = e[prop] ?? (e.touches.length ? e.touches[0][prop] : undefined)

    if (isVertical) {
      console.log(document.body.offsetHeight, pos)
      pos = document.body.offsetHeight - pos
    }

    if (e.buttons === 0) {
      drag = false
    } else {
      if (isVertical) {
        document.body.style.gridTemplateRows = 'min-content auto ' + pos + 'px'
      } else {
        document.body.style.gridTemplateColumns = pos + 'px auto'
      }
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

function resize () {
  const _isVertical = getComputedStyle(document.querySelector('.sidebar-active aside')).borderRightWidth === '0px'

  if (isVertical !== _isVertical) {
    isVertical = _isVertical
    document.body.style.gridTemplateColumns = null
    document.body.style.gridTemplateRows = null
  }
}

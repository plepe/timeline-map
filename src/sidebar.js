import App from 'geowiki-viewer/src/App'

let sidebar, content, resizer
let drag = false

App.addExtension({
  id: 'sidebar',
  initFun: (app, callback) => {
    document.body.classList.add('sidebar')
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

    app.refresh()
    callback()
  }
})

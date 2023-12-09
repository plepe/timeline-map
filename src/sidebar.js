import App from 'geowiki-viewer/src/App'

let sidebar, content

App.addExtension({
  id: 'sidebar',
  initFun: (app, callback) => {
    document.body.classList.add('sidebar')
    sidebar = document.createElement('aside')
    document.body.appendChild(sidebar)

    content = document.createElement('div')
    content.className = 'content'
    sidebar.appendChild(content)

    app.refresh()
    callback()
  }
})

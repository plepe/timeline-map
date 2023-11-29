import twigGet from './twigGet'

module.exports = function applyPopupModifier (div, modifier, data) {
  if (!Array.isArray(modifier)) {
    return
  }

  modifier.forEach((mod) => {
    const v = document.createElement('div')
    v.innerHTML = twigGet(mod.content, data)

    if (mod.query) {
      const found = div.querySelector(mod.query)
      if (found) {
        apply(found, mod, v)
      }
    }
    else if (mod.queryAll) {
      const found = div.querySelectorAll(mod.queryAll)
      Array.from(found).forEach(f => {
        apply(f, mod, v)
      })
    }
  })
}

function apply (found, mod, v) {
  if (mod.action === 'append') {
    while (v.firstChild) {
      found.appendChild(v.firstChild)
    }
  }
  else if (mod.action === 'prepend') {
    while (v.lastChild) {
      found.insertBefore(v.lastChild, found.firstChild)
    }
  }
  else if (!mod.action || mod.action === 'replace') {
    found.innerHTML = v.innerHTML
  }
  else {
    console.error('Invalid modifier action: ' + mod.action, mod)
  }
}

function createElement (text, mod, data) {
  return v
}

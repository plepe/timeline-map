const cache = {}
const loading = {}

module.exports = function loader (url, options, callback) {
  if (url in cache) {
    return callback(null, cache[url])
  }

  if (url in loading) {
    return loading[url].push(callback)
  }

  loading[url] = [callback]

  fetch(url)
    .then(req => req.json())
    .then(data => {
      const cbs = loading[url]
      delete loading[url]
      cache[url] = data

      if (cbs) {
        cbs.forEach(cb => global.setTimeout(() => cb(null, data), 0))
      }
    })
    .catch(err => {
      const cbs = loading[url]
      delete loading[url]

      if (cbs) {
        cbs.forEach(cb => global.setTimeout(() => cb(err), 0))
      } else {
        console.error('callbacks already cleared?')
      }
    })
}

module.exports = function loader (url, options, callback) {
  fetch(url)
    .then(req => req.json())
    .then(data => {
      callback(null, data)
    })
}

module.exports = function (v) {
  if (v === false) {
    return false
  }

  v = v.trim()
  if (v === 'false' || v === '' || v === '0') {
    return false
  }

  return true
}

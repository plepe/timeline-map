module.exports = function (v) {
  if (typeof v === 'boolean') {
    return v
  }

  v = v.trim()
  if (v === 'false' || v === '' || v === '0') {
    return false
  }

  return true
}

const moment = require('moment')

module.exports = function completeDate (date, timestamp) {
  if (date === null) {
    return null
  }
  if (typeof date !== 'string') {
    date = '' + date
  }

  if (date.match(/^[0-9]{3}x$/)) {
    return moment(date.substr(0, 3) + (timestamp === 'start' ? '0' : '9'))[timestamp + 'Of']('year').format('YYYY-MM-DD')
  }

  switch (date.length) {
    case 4:
      return moment(date)[timestamp + 'Of']('year').format('YYYY-MM-DD')
    case 7:
      return moment(date)[timestamp + 'Of']('month').format('YYYY-MM-DD')
    default:
      return date
  }
}


const moment = require('moment')

module.exports = function getTimespan (app) {
  return new Promise((resolve, reject) => {
    app.getParameter('timeline-timespan', 'all')
      .then(values => {
        if (!values) {
          return resolve({ start: null, end: null })
        }

        if (Array.isArray(values)) {
          let start = values.map(v => v.start).filter(v => v).sort()
          start = start.length ? start[0] : app.config.timeline.defaultMin
          let end = values.map(v => v.end).filter(v => v).sort().reverse()
          end = end.length ? end[0] : app.config.timeline.defaultMax

          start = completeDate(start, 'start')
          end = completeDate(end, 'end')

          return resolve({ start, end })
        }

        resolve(values)
      })
  })
}

function completeDate (date, timestamp) {
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

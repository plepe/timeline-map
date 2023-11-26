const completeDate = require('./completeDate')

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

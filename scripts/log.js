var chalk = require('chalk')
var process = require('process')

var isWin = process.platform === 'win32'

const symbols = {
  ok: chalk.green(isWin ? '\u221A' : '✓'),
  error: isWin ? '\u00D7' : '✖',
  warn: '!'
}

const { log: origLog, warn, error } = console

function withTextColor (args, chalkColor = chalk.gray) {
  return args.map(arg => chalkColor(arg))
}

function log (...args) {
  origLog(...args)
}

log.error = function (...args) {
  error(...withTextColor([symbols.error, ...args], chalk.red))
}

log.warn = function (...args) {
  warn(...withTextColor([symbols.warn, ...args], chalk.yellow))
}

log.gray = function (...args) {
  origLog(...withTextColor(args))
}

log.chalk = chalk

log.symbols = symbols

// WARNING: overwrites console.log to improve iD-presets-builder loggin
console.log = log
console.warn = log.warn
console.error = log.error

// Put things back before the notifier script runs, so we don't mess up the
// notifier log message
process.on('beforeExit', () => {
  console.log = origLog
  console.warn = warn
  console.error = error
})

module.exports = log

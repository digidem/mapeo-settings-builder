var chalk = require('chalk')
var process = require('process')

var isWin = process.platform === 'win32'

const symbols = {
  ok: chalk.bold.green(isWin ? '\u221A' : '✓'),
  error: chalk.bold.red(isWin ? '\u00D7' : '✖'),
  warn: chalk.bold.keyword('orange')('!')
}

let _printNewLineBeforeNextLog = false
// let _isLastLineNewLine = false

function _updateIsLastLineNewLine (args) {
  // if (args.length === 0) {
  //   _isLastLineNewLine = true
  // } else {
  //   let lastArg = args[args.length - 1]
  //   if (
  //     typeof lastArg === 'string' &&
  //     (lastArg === '' || lastArg.match(/[\r\n]$/))
  //   ) {
  //     _isLastLineNewLine = true
  //   } else {
  //     _isLastLineNewLine = false
  //   }
  // }
}

const { log: origLog, warn, error } = console

function _maybePrintNewLine () {
  if (_printNewLineBeforeNextLog) {
    _printNewLineBeforeNextLog = false
    log()
  }
}

function consoleLog (...args) {
  _maybePrintNewLine()
  _updateIsLastLineNewLine(args)

  origLog(...args)
}

function consoleWarn (...args) {
  _maybePrintNewLine()
  _updateIsLastLineNewLine(args)

  warn(...args)
}

function consoleError (...args) {
  _maybePrintNewLine()
  _updateIsLastLineNewLine(args)

  error(...args)
}

function getPrefix (chalkColor) {
  return chalkColor(`[${new Date().toTimeString().slice(0, 8)}]`)
}

function withPrefixAndTextColor (args, chalkColor = chalk.gray) {
  return [getPrefix(chalkColor), ...args.map(arg => chalkColor(arg))]
}

function withPrefix (args, chalkColor = chalk.gray) {
  return [getPrefix(chalkColor), ...args]
}

function log (...args) {
  if (log.config.raw) {
    return
  }

  consoleLog(...withPrefix(args))
}

log.error = function error (...args) {
  if (log.config.raw) {
    return
  }
  consoleError(...withPrefixAndTextColor([symbols.error, ...args], chalk.red))
}

log.warn = function warn (...args) {
  if (log.config.raw) {
    return
  }
  consoleWarn(...withPrefixAndTextColor(args, chalk.yellow))
}

log.gray = function (...args) {
  if (log.config.raw) {
    return
  }
  consoleLog(...withPrefixAndTextColor(args))
}

log.raw = function (...args) {
  if (!log.config.raw) {
    return
  }
  consoleLog(...args)
}

log.chalk = chalk

log.config = {
  raw: false
}

log.symbols = symbols

console.log = log
console.warn = log.warn
console.error = log.error

module.exports = log

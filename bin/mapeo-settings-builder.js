#!/usr/bin/env node

var updateNotifier = require('update-notifier')
var { program, CommanderError } = require('commander')
var { randomBytes } = require('crypto')
var pkg = require('../package.json')
var log = require('../scripts/log')
var buildLint = require('../commands/build_lint')
var extractMessages = require('../commands/extract_messages')

var { chalk } = log

const notifier = updateNotifier({
  pkg,
  updateCheckInterval: 1000 * 60 * 60, // One hour
  shouldNotifyInNpmScript: true
})

if (notifier.update && notifier.update.type !== 'major') {
  notifier.notify({
    message: `Update of ${pkg.name} available!
${chalk.red('v{currentVersion}')} → ${chalk.green('v{latestVersion}')}
${chalk.yellow("See what's new:")} ${chalk.cyan('https://git.io/JvVVl')}
Run ${chalk.green(`npm upgrade ${pkg.name}`)} to update`
  })
}

log(
  `→ ${log.chalk.gray(
    `Using version ${log.chalk.white.bold(
      pkg.version
    )} of mapeo-settings-builder`
  )}`
)

program
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)

const cwd = process.cwd()

program
  .command('build [sourceDir]')
  .description('Build config from presets in current working dir')
  .option('-o, --output <file>', 'Output file (defaults to stdout)')
  .option('-l, --lang <language-code>', 'Default language of presets', 'en')
  .option('-t, --timeout <number>', 'Timeout limit (in milliseconds) for icon generation process', function(value) {
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
      throw new CommanderError(1, 'commander.invalidArgument', `Value "${value}" is not a number`)
    }
    return parsedValue;
  }, 2000)
  .action((sourceDir, opts) => {
    buildLint(opts, sourceDir || cwd)
  })

program
  .command('lint [sourceDir]')
  .description('Lint preset files for errors')
  .action((sourceDir, opts) => {
    buildLint(opts, sourceDir || cwd, { lint: true })
  })

program
  .command('extract-messages')
  .description('Extract messages for translation')
  .option('-o, --output <file>', 'Output file (defaults to stdout)')
  .action(opts => {
    extractMessages(opts)
  })

program
  .command('generate-key')
  .description('Generate a random project key')
  .action(() => {
    process.stdout.write(randomBytes(32).toString('hex'))
    process.stderr.write('\n')
  })

program.parse(process.argv)

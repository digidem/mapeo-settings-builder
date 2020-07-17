var fs = require('fs')
var presetsBuilder = require('id-presets-builder')
var stringify = require('safe-stable-stringify').default
var extractMessages = require('../scripts/extract_messages')
var log = require('../scripts/log')

module.exports = function ({ output }, sourceDir) {
  const start = Date.now()
  presetsBuilder.generatePresets(sourceDir, { additionalProperties: true }, (err, presets) => {
    if (err) process.exit(1)
    var translatableStrings = presetsBuilder.generateTranslations(
      presets.categories,
      presets.fields,
      presets.presets
    )
    var messages = stringify(extractMessages(translatableStrings), null, 2)
    output ? fs.writeFileSync(output, messages) : process.stdout.write(messages)

    log(`${log.symbols.ok} Extracted messages ${log.chalk.gray(
      `(${Date.now() - start}ms)`
    )}`)
  })
}

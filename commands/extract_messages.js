import fs from 'fs'
import presetsBuilder from 'id-presets-builder'
import stringify from 'safe-stable-stringify'
import extractMessages from '../scripts/extract_messages.js'
import log from '../scripts/log.js'

export default function({ output }, sourceDir) {
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

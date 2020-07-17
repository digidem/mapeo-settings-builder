var fs = require('fs')
var path = require('path')
var run = require('run-series')
var presetsBuilder = require('id-presets-builder')
var tar = require('tar-stream')
var exists = require('fs-exists-sync')
var jsonschema = require('jsonschema')
var pump = require('pump')

var imagerySchema = require('../schema/imagery.json')
var buildSVGSprite = require('../scripts/build_svg_sprite')
var buildPNGSprite = require('../scripts/build_png_sprite')
var buildPNGIcons = require('../scripts/build_png_icons')
var buildTranslations = require('../scripts/build_translations')
var checkIcons = require('../scripts/check_icons')
var pkg = require('../package.json')
var log = require('../scripts/log')

module.exports = function ({ output, lang }, sourceDir, { lint } = { lint: false }) {
  var iconDir = path.join(sourceDir, 'icons')
  var messagesDir = path.join(sourceDir, 'messages')
  var imageryFile = path.join(sourceDir, 'imagery.json')
  var styleFile = path.join(sourceDir, 'style.css')
  var layersFile = path.join(sourceDir, 'layers.json')
  var metadataFile = path.join(sourceDir, 'metadata.json')
  var pak = {}
  try {
    pak = JSON.parse(fs.readFileSync(path.join(sourceDir, 'package.json'), 'utf8'))
  } catch (e) {
    log.error(
      'Could not read package.json from the presets you are trying to build'
    )
  }

  const start = Date.now()

  run(
    [
      wrapWithLog(
        'Built presets and categories',
        presetsBuilder.generatePresets.bind(null, sourceDir, {
          additionalProperties: true
        })
      ),
      wrapWithLog(
        'Generated svg sprite for iD',
        buildSVGSprite.bind(null, iconDir)
      ),
      wrapWithLog(
        'Generated png sprite for Mapbox',
        buildPNGSprite.bind(null, iconDir)
      ),
      wrapWithLog(
        'Generated png icons for Mapeo Mobile',
        buildPNGIcons.bind(null, iconDir)
      ),
      wrapWithLog(
        'Generated translations',
        buildTranslations.bind(null, messagesDir)
      )
    ],
    function (err, results) {
      if (err) return done(err)
      var presets = results[0]
      var svgSprite = results[1]
      var pngSprite = results[2].png
      var pngLayout = results[2].layout
      var pngIcons = results[3]
      var translations = results[4]

      if (exists(imageryFile)) {
        try {
          var imagery = fs.readFileSync(imageryFile)
          var imageryObj = JSON.parse(imagery.toString())
        } catch (e) {
          done(e)
        }
        if (!validate(imageryFile, imageryObj, imagerySchema)) {
          return done(new Error(imageryFile + ': Imagery structure is invalid'))
        }
      }

      if (!translations) {
        translations = {}
        translations[lang] = {
          presets: presetsBuilder.generateTranslations(
            presets.categories,
            presets.fields,
            presets.presets
          )
        }
      }

      try {
        checkIcons(presets.presets, iconDir)
      } catch (e) {
        done(e)
      }

      if (lint) {
        return log(log.chalk.bold(log.symbols.ok + ' Presets are valid'))
      }

      var pack = tar.pack()
      pack.on('error', done)
      pack.entry({ name: 'presets.json' }, stringify(presets))
      pack.entry({ name: 'translations.json' }, stringify(translations))
      if (svgSprite) {
        pack.entry({ name: 'icons.svg' }, svgSprite)
      }
      if (pngSprite) {
        pack.entry({ name: 'icons.png' }, pngSprite)
        pack.entry({ name: 'icons.json' }, JSON.stringify(pngLayout, null, 2))
      }
      if (imagery) {
        pack.entry({ name: 'imagery.json' }, imagery)
      }
      if (exists(styleFile)) {
        pack.entry({ name: 'style.css' }, fs.readFileSync(styleFile))
      }
      if (exists(layersFile)) {
        pack.entry({ name: 'layers.json' }, fs.readFileSync(layersFile))
      }
      var metadata = {}
      if (exists(metadataFile)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'))
        } catch (e) {
          log.warn('Could not parse metadata.json file:', e)
        }
      }
      metadata.name = metadata.name || pak.name
      metadata.version = metadata.version || pak.version
      pack.entry({ name: 'metadata.json' }, stringify(metadata))
      if (pngIcons) {
        pngIcons.forEach(icon => {
          pack.entry({ name: `icons/${icon.filename}` }, icon.png)
        })
      }
      pack.entry({ name: 'VERSION' }, pkg.version)
      pack.finalize()
      var outputStream = output ? fs.createWriteStream(output) : process.stdout
      pump(pack, outputStream, err => {
        if (err) log.error(`Error writing file ${output}`)
        else {
          log(
            `${log.chalk.bold(
              log.symbols.ok + ' Successfully created file'
            )} '${log.chalk.italic(output)}' ${log.chalk.gray(
              `(total ${Date.now() - start}ms)`
            )}`
          )
        }
      })
    }
  )
}

function wrapWithLog (msg, fn) {
  return cb => {
    const start = Date.now()
    fn((err, result) => {
      if (err) {
        log.error(err)
      } else {
        log(
          `${log.symbols.ok} ${msg} ${log.chalk.gray(
            `(${Date.now() - start}ms)`
          )}`
        )
      }
      cb(err, result)
    })
  }
}

function stringify (o) {
  return JSON.stringify(o, null, 4)
}

function done (err) {
  if (!err) return
  log.error(err.stack)
  process.exit(1)
}

function validate (filename, instance, schema) {
  var errors = jsonschema.validate(instance, schema).errors
  if (!errors.length) return true
  log.error(filename + ': ')
  errors.forEach(function (error) {
    if (error.property) {
      log.error(error.property + ' ' + error.message)
    } else {
      log.error(error)
    }
  })
  return false
}
